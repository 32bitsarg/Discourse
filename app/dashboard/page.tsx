'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Settings, Save, Loader2, CheckCircle, XCircle, Globe, Shield, Palette,
  Users, FileText, ThumbsUp, Mail, Search, Lock, ChevronDown, ChevronUp
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    general: true,
    appearance: false,
    users: false,
    content: false,
    voting: false,
    email: false,
    seo: false,
    security: false,
  })
  
  const [settings, setSettings] = useState({
    // General
    siteName: 'Discourse',
    siteDescription: '',
    // Appearance
    siteLogo: '',
    siteFavicon: '',
    primaryColor: '#6366f1',
    headerBanner: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    // Users
    publicRegistration: true,
    emailVerificationRequired: false,
    minimumAge: '13',
    allowCustomAvatars: true,
    allowProfileBanners: true,
    minKarmaCreateCommunity: '0',
    // Content
    allowCommunityCreation: true,
    communityApprovalRequired: false,
    maxPostLength: '10000',
    maxCommentLength: '5000',
    allowImagesInPosts: true,
    allowVideosInPosts: true,
    allowExternalLinks: true,
    bannedWords: '',
    // Voting
    showVoteCounts: true,
    allowDownvotes: true,
    minKarmaToVote: '0',
    minKarmaToComment: '0',
    // Email
    adminEmail: '',
    sendWelcomeEmails: true,
    sendPostNotifications: false,
    // SEO
    googleAnalyticsId: '',
    // Security
    rateLimitPerMinute: '60',
    captchaOnRegistration: false,
    captchaOnPosts: false,
  })

  useEffect(() => {
    checkAuth()
    loadSettings()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      
      if (!res.ok || !data.user) {
        router.push('/feed')
        return
      }
      
      setUser(data.user)
      
      // Verificar si es admin
      const adminRes = await fetch('/api/admin/check')
      const adminData = await adminRes.json()
      setIsAdmin(adminData.isAdmin || false)
      
      if (!adminData.isAdmin) {
        setError('No tienes permisos para acceder al dashboard')
        setTimeout(() => {
          router.push('/feed')
        }, 2000)
        return
      }
    } catch (err) {
      router.push('/feed')
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) {
        throw new Error('Error cargando configuración')
      }
      
      const data = await res.json()
      const settingsMap = data.settings.reduce((acc: any, setting: any) => {
        acc[setting.key_name] = setting.value
        return acc
      }, {})
      
      setSettings({
        siteName: settingsMap.site_name || 'Discourse',
        siteDescription: settingsMap.site_description || '',
        siteLogo: settingsMap.site_logo || '',
        siteFavicon: settingsMap.site_favicon || '',
        primaryColor: settingsMap.primary_color || '#6366f1',
        headerBanner: settingsMap.header_banner || '',
        metaTitle: settingsMap.meta_title || '',
        metaDescription: settingsMap.meta_description || '',
        metaKeywords: settingsMap.meta_keywords || '',
        publicRegistration: settingsMap.public_registration === 'true',
        emailVerificationRequired: settingsMap.email_verification_required === 'true',
        minimumAge: settingsMap.minimum_age || '13',
        allowCustomAvatars: settingsMap.allow_custom_avatars === 'true',
        allowProfileBanners: settingsMap.allow_profile_banners === 'true',
        minKarmaCreateCommunity: settingsMap.min_karma_create_community || '0',
        allowCommunityCreation: settingsMap.allow_community_creation === 'true',
        communityApprovalRequired: settingsMap.community_approval_required === 'true',
        maxPostLength: settingsMap.max_post_length || '10000',
        maxCommentLength: settingsMap.max_comment_length || '5000',
        allowImagesInPosts: settingsMap.allow_images_in_posts === 'true',
        allowVideosInPosts: settingsMap.allow_videos_in_posts === 'true',
        allowExternalLinks: settingsMap.allow_external_links === 'true',
        bannedWords: settingsMap.banned_words || '',
        showVoteCounts: settingsMap.show_vote_counts === 'true',
        allowDownvotes: settingsMap.allow_downvotes === 'true',
        minKarmaToVote: settingsMap.min_karma_to_vote || '0',
        minKarmaToComment: settingsMap.min_karma_to_comment || '0',
        adminEmail: settingsMap.admin_email || '',
        sendWelcomeEmails: settingsMap.send_welcome_emails === 'true',
        sendPostNotifications: settingsMap.send_post_notifications === 'true',
        googleAnalyticsId: settingsMap.google_analytics_id || '',
        rateLimitPerMinute: settingsMap.rate_limit_per_minute || '60',
        captchaOnRegistration: settingsMap.captcha_on_registration === 'true',
        captchaOnPosts: settingsMap.captcha_on_posts === 'true',
      })
    } catch (err: any) {
      console.error('Error cargando settings:', err)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updateSetting = async (key: string, value: string, description?: string) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, description }),
    })
    return res.ok
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const updates = [
        // General
        { key: 'site_name', value: settings.siteName, desc: 'Nombre del sitio/foro' },
        { key: 'site_description', value: settings.siteDescription, desc: 'Descripción del sitio' },
        // Appearance
        { key: 'site_logo', value: settings.siteLogo, desc: 'URL del logo del sitio' },
        { key: 'site_favicon', value: settings.siteFavicon, desc: 'URL del favicon' },
        { key: 'primary_color', value: settings.primaryColor, desc: 'Color primario del tema' },
        { key: 'header_banner', value: settings.headerBanner, desc: 'URL del banner/header image' },
        { key: 'meta_title', value: settings.metaTitle, desc: 'Meta title para SEO' },
        { key: 'meta_description', value: settings.metaDescription, desc: 'Meta description para SEO' },
        { key: 'meta_keywords', value: settings.metaKeywords, desc: 'Meta keywords para SEO' },
        // Users
        { key: 'public_registration', value: settings.publicRegistration.toString(), desc: 'Permitir registro público' },
        { key: 'email_verification_required', value: settings.emailVerificationRequired.toString(), desc: 'Requiere verificación de email' },
        { key: 'minimum_age', value: settings.minimumAge, desc: 'Edad mínima para registrarse' },
        { key: 'allow_custom_avatars', value: settings.allowCustomAvatars.toString(), desc: 'Permitir avatares personalizados' },
        { key: 'allow_profile_banners', value: settings.allowProfileBanners.toString(), desc: 'Permitir banners de perfil' },
        { key: 'min_karma_create_community', value: settings.minKarmaCreateCommunity, desc: 'Karma mínimo para crear comunidades' },
        // Content
        { key: 'allow_community_creation', value: settings.allowCommunityCreation.toString(), desc: 'Permitir creación de comunidades' },
        { key: 'community_approval_required', value: settings.communityApprovalRequired.toString(), desc: 'Requiere aprobación para nuevas comunidades' },
        { key: 'max_post_length', value: settings.maxPostLength, desc: 'Límite de caracteres en posts' },
        { key: 'max_comment_length', value: settings.maxCommentLength, desc: 'Límite de caracteres en comentarios' },
        { key: 'allow_images_in_posts', value: settings.allowImagesInPosts.toString(), desc: 'Permitir imágenes en posts' },
        { key: 'allow_videos_in_posts', value: settings.allowVideosInPosts.toString(), desc: 'Permitir videos en posts' },
        { key: 'allow_external_links', value: settings.allowExternalLinks.toString(), desc: 'Permitir enlaces externos' },
        { key: 'banned_words', value: settings.bannedWords, desc: 'Palabras prohibidas (separadas por comas)' },
        // Voting
        { key: 'show_vote_counts', value: settings.showVoteCounts.toString(), desc: 'Mostrar contador de votos' },
        { key: 'allow_downvotes', value: settings.allowDownvotes.toString(), desc: 'Permitir downvotes' },
        { key: 'min_karma_to_vote', value: settings.minKarmaToVote, desc: 'Karma mínimo para votar' },
        { key: 'min_karma_to_comment', value: settings.minKarmaToComment, desc: 'Karma mínimo para comentar' },
        // Email
        { key: 'admin_email', value: settings.adminEmail, desc: 'Email del administrador' },
        { key: 'send_welcome_emails', value: settings.sendWelcomeEmails.toString(), desc: 'Enviar emails de bienvenida' },
        { key: 'send_post_notifications', value: settings.sendPostNotifications.toString(), desc: 'Enviar notificaciones de nuevos posts' },
        // SEO
        { key: 'google_analytics_id', value: settings.googleAnalyticsId, desc: 'Google Analytics ID' },
        // Security
        { key: 'rate_limit_per_minute', value: settings.rateLimitPerMinute, desc: 'Rate limiting (requests por minuto)' },
        { key: 'captcha_on_registration', value: settings.captchaOnRegistration.toString(), desc: 'CAPTCHA en registro' },
        { key: 'captcha_on_posts', value: settings.captchaOnPosts.toString(), desc: 'CAPTCHA en posts' },
      ]

      for (const update of updates) {
        const success = await updateSetting(update.key, update.value, update.desc)
        if (!success) {
          throw new Error(`Error actualizando ${update.key}`)
        }
      }

      setSuccess('Configuración guardada exitosamente')
      
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Error guardando configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const SectionHeader = ({ icon: Icon, title, description, sectionKey }: any) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronUp className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400" />
      )}
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard de Administración
            </h1>
            <p className="text-gray-600">
              Gestiona la configuración completa de tu foro
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="space-y-4">
              {/* Configuración General */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <SectionHeader
                  icon={Globe}
                  title="Configuración General"
                  description="Nombre y descripción básica del foro"
                  sectionKey="general"
                />
                {expandedSections.general && (
                  <div className="px-6 pb-6 space-y-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Foro
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.siteName}
                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Mi Foro"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Este nombre aparecerá en el header y otros lugares del sitio
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción del Sitio (Opcional)
                      </label>
                      <textarea
                        value={settings.siteDescription}
                        onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Una breve descripción de tu foro..."
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Apariencia y Branding */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <SectionHeader
                  icon={Palette}
                  title="Apariencia y Branding"
                  description="Personaliza el aspecto visual de tu foro"
                  sectionKey="appearance"
                />
                {expandedSections.appearance && (
                  <div className="px-6 pb-6 space-y-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo del Sitio (URL)
                      </label>
                      <input
                        type="url"
                        value={settings.siteLogo}
                        onChange={(e) => setSettings({ ...settings, siteLogo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="https://ejemplo.com/logo.png"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Favicon (URL)
                      </label>
                      <input
                        type="url"
                        value={settings.siteFavicon}
                        onChange={(e) => setSettings({ ...settings, siteFavicon: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="https://ejemplo.com/favicon.ico"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color Primario
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.primaryColor}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="#6366f1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Banner/Header Image (URL)
                      </label>
                      <input
                        type="url"
                        value={settings.headerBanner}
                        onChange={(e) => setSettings({ ...settings, headerBanner: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="https://ejemplo.com/banner.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Title (SEO)
                      </label>
                      <input
                        type="text"
                        value={settings.metaTitle}
                        onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Título para motores de búsqueda"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Description (SEO)
                      </label>
                      <textarea
                        value={settings.metaDescription}
                        onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Descripción para motores de búsqueda"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Keywords (SEO)
                      </label>
                      <input
                        type="text"
                        value={settings.metaKeywords}
                        onChange={(e) => setSettings({ ...settings, metaKeywords: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="palabra1, palabra2, palabra3"
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Configuración de Usuarios */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <SectionHeader
                  icon={Users}
                  title="Configuración de Usuarios"
                  description="Controla el registro y permisos de usuarios"
                  sectionKey="users"
                />
                {expandedSections.users && (
                  <div className="px-6 pb-6 space-y-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Registro Público
                        </label>
                        <p className="text-sm text-gray-500">Permitir que nuevos usuarios se registren</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.publicRegistration}
                          onChange={(e) => setSettings({ ...settings, publicRegistration: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Verificación de Email Requerida
                        </label>
                        <p className="text-sm text-gray-500">Los usuarios deben verificar su email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.emailVerificationRequired}
                          onChange={(e) => setSettings({ ...settings, emailVerificationRequired: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Edad Mínima para Registrarse
                      </label>
                      <input
                        type="number"
                        min="13"
                        value={settings.minimumAge}
                        onChange={(e) => setSettings({ ...settings, minimumAge: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Permitir Avatares Personalizados
                        </label>
                        <p className="text-sm text-gray-500">Los usuarios pueden subir sus propios avatares</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.allowCustomAvatars}
                          onChange={(e) => setSettings({ ...settings, allowCustomAvatars: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Permitir Banners de Perfil
                        </label>
                        <p className="text-sm text-gray-500">Los usuarios pueden personalizar sus banners</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.allowProfileBanners}
                          onChange={(e) => setSettings({ ...settings, allowProfileBanners: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Karma Mínimo para Crear Comunidades
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.minKarmaCreateCommunity}
                        onChange={(e) => setSettings({ ...settings, minKarmaCreateCommunity: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Configuración de Contenido */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <SectionHeader
                  icon={FileText}
                  title="Configuración de Contenido"
                  description="Controla qué tipo de contenido se permite"
                  sectionKey="content"
                />
                {expandedSections.content && (
                  <div className="px-6 pb-6 space-y-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Permitir Creación de Comunidades
                        </label>
                        <p className="text-sm text-gray-500">Los usuarios pueden crear nuevas comunidades</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.allowCommunityCreation}
                          onChange={(e) => setSettings({ ...settings, allowCommunityCreation: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Requiere Aprobación para Comunidades
                        </label>
                        <p className="text-sm text-gray-500">Las nuevas comunidades necesitan aprobación</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.communityApprovalRequired}
                          onChange={(e) => setSettings({ ...settings, communityApprovalRequired: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Límite de Caracteres en Posts
                      </label>
                      <input
                        type="number"
                        min="100"
                        value={settings.maxPostLength}
                        onChange={(e) => setSettings({ ...settings, maxPostLength: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Límite de Caracteres en Comentarios
                      </label>
                      <input
                        type="number"
                        min="50"
                        value={settings.maxCommentLength}
                        onChange={(e) => setSettings({ ...settings, maxCommentLength: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Permitir Imágenes en Posts
                        </label>
                        <p className="text-sm text-gray-500">Los usuarios pueden incluir imágenes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.allowImagesInPosts}
                          onChange={(e) => setSettings({ ...settings, allowImagesInPosts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Permitir Videos en Posts
                        </label>
                        <p className="text-sm text-gray-500">Los usuarios pueden incluir videos</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.allowVideosInPosts}
                          onChange={(e) => setSettings({ ...settings, allowVideosInPosts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Permitir Enlaces Externos
                        </label>
                        <p className="text-sm text-gray-500">Los usuarios pueden compartir enlaces</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.allowExternalLinks}
                          onChange={(e) => setSettings({ ...settings, allowExternalLinks: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Palabras Prohibidas
                      </label>
                      <textarea
                        value={settings.bannedWords}
                        onChange={(e) => setSettings({ ...settings, bannedWords: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="palabra1, palabra2, palabra3 (separadas por comas)"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Palabras que serán filtradas automáticamente del contenido
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Configuración de Votación */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <SectionHeader
                  icon={ThumbsUp}
                  title="Configuración de Votación"
                  description="Controla cómo funcionan los votos y el karma"
                  sectionKey="voting"
                />
                {expandedSections.voting && (
                  <div className="px-6 pb-6 space-y-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mostrar Contador de Votos
                        </label>
                        <p className="text-sm text-gray-500">Mostrar el número de votos públicamente</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showVoteCounts}
                          onChange={(e) => setSettings({ ...settings, showVoteCounts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Permitir Downvotes
                        </label>
                        <p className="text-sm text-gray-500">Los usuarios pueden votar negativamente</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.allowDownvotes}
                          onChange={(e) => setSettings({ ...settings, allowDownvotes: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Karma Mínimo para Votar
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.minKarmaToVote}
                        onChange={(e) => setSettings({ ...settings, minKarmaToVote: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Karma Mínimo para Comentar
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={settings.minKarmaToComment}
                        onChange={(e) => setSettings({ ...settings, minKarmaToComment: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Email y Notificaciones */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <SectionHeader
                  icon={Mail}
                  title="Email y Notificaciones"
                  description="Configura las notificaciones por email"
                  sectionKey="email"
                />
                {expandedSections.email && (
                  <div className="px-6 pb-6 space-y-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email del Administrador
                      </label>
                      <input
                        type="email"
                        value={settings.adminEmail}
                        onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="admin@ejemplo.com"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Enviar Emails de Bienvenida
                        </label>
                        <p className="text-sm text-gray-500">Enviar email cuando un usuario se registra</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.sendWelcomeEmails}
                          onChange={(e) => setSettings({ ...settings, sendWelcomeEmails: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notificaciones de Nuevos Posts
                        </label>
                        <p className="text-sm text-gray-500">Enviar notificaciones cuando hay nuevos posts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.sendPostNotifications}
                          onChange={(e) => setSettings({ ...settings, sendPostNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* SEO y Analytics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <SectionHeader
                  icon={Search}
                  title="SEO y Analytics"
                  description="Mejora el SEO y rastrea visitantes"
                  sectionKey="seo"
                />
                {expandedSections.seo && (
                  <div className="px-6 pb-6 space-y-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Analytics ID
                      </label>
                      <input
                        type="text"
                        value={settings.googleAnalyticsId}
                        onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="G-XXXXXXXXXX"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        ID de seguimiento de Google Analytics (ej: G-XXXXXXXXXX)
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Seguridad */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <SectionHeader
                  icon={Lock}
                  title="Seguridad"
                  description="Protege tu foro de spam y abusos"
                  sectionKey="security"
                />
                {expandedSections.security && (
                  <div className="px-6 pb-6 space-y-4 border-t">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate Limiting (Requests por Minuto)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settings.rateLimitPerMinute}
                        onChange={(e) => setSettings({ ...settings, rateLimitPerMinute: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Número máximo de requests por minuto por IP
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CAPTCHA en Registro
                        </label>
                        <p className="text-sm text-gray-500">Requerir CAPTCHA al registrarse</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.captchaOnRegistration}
                          onChange={(e) => setSettings({ ...settings, captchaOnRegistration: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CAPTCHA en Posts
                        </label>
                        <p className="text-sm text-gray-500">Requerir CAPTCHA al crear posts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.captchaOnPosts}
                          onChange={(e) => setSettings({ ...settings, captchaOnPosts: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Botón de guardar */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Todos los Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
