'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Settings, Save, Loader2, CheckCircle, XCircle, Globe, Shield, Palette,
  Users, FileText, ThumbsUp, Mail, Search, Lock, ChevronDown, ChevronUp, Home, Check, X, Flag, Trash2, Eye, AlertTriangle
} from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import { useUser, useIsAdmin } from '@/lib/hooks/useUser'
import { useSettings } from '@/lib/hooks/useSettings'
import DashboardSidebar from '@/components/DashboardSidebar'

export default function DashboardPage() {
  const router = useRouter()
  // OPTIMIZACIÓN: Usar SWR para obtener usuario y admin status
  const { user, isLoading: userLoading } = useUser()
  const { isAdmin, isLoading: adminLoading } = useIsAdmin()
  const { settings: settingsData, loading: settingsLoading } = useSettings()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('general')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCommunities, setPendingCommunities] = useState<any[]>([])
  const [loadingCommunities, setLoadingCommunities] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [reportStatus, setReportStatus] = useState<'pending' | 'reviewed' | 'resolved' | 'dismissed'>('pending')
  const [statusCounts, setStatusCounts] = useState<any>({})
  const [moderationHistory, setModerationHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  const loading = userLoading || adminLoading || settingsLoading
  
  // Estado local para settings (se llena desde SWR)
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

  // Verificar autenticación y permisos usando SWR
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/feed')
        return
      }
      
      if (!isAdmin) {
        setError('No tienes permisos para acceder al dashboard')
        setTimeout(() => {
          router.push('/feed')
        }, 2000)
        return
      }
    }
  }, [user, isAdmin, loading, router])

  // Convertir settings de SWR al formato esperado
  useEffect(() => {
    if (settingsData && !settingsLoading) {
      const settingsMap = settingsData.settings?.reduce((acc: any, setting: any) => {
        acc[setting.key_name] = setting.value
        return acc
      }, {}) || {}
      
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

  const updateSetting = async (key: string, value: string, description?: string) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, description }),
    })
    return res.ok
  }

  useEffect(() => {
    if (isAdmin) {
      loadPendingCommunities()
      loadReports()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin && activeSection === 'moderation') {
      loadReports()
      loadModerationHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, reportStatus])

  const loadModerationHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/moderation/history?limit=50')
      if (res.ok) {
        const data = await res.json()
        setModerationHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const loadPendingCommunities = async () => {
    if (!isAdmin) return
    setLoadingCommunities(true)
    try {
      const res = await fetch('/api/subforums/pending')
      if (res.ok) {
        const data = await res.json()
        setPendingCommunities(data.communities || [])
      }
    } catch (error) {
      console.error('Error cargando comunidades pendientes:', error)
    } finally {
      setLoadingCommunities(false)
    }
  }

  const loadReports = async () => {
    if (!isAdmin) return
    setLoadingReports(true)
    try {
      const res = await fetch(`/api/reports?status=${reportStatus}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports || [])
        setStatusCounts(data.statusCounts || {})
      }
    } catch (error) {
      console.error('Error cargando reportes:', error)
    } finally {
      setLoadingReports(false)
    }
  }

  const handleCommunityAction = async (communityId: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/subforums/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId, action }),
      })

      if (!res.ok) {
        const error = await res.json()
        setError(error.message || 'Error al gestionar la comunidad')
        return
      }

      setSuccess(action === 'approve' ? 'Comunidad aprobada exitosamente' : 'Comunidad rechazada')
      loadPendingCommunities()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError('Error al gestionar la comunidad')
    }
  }

  const handleReportAction = async (reportId: number, action: 'delete' | 'hide' | 'dismiss' | 'warn', actionTaken?: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, actionTaken }),
      })

      if (!res.ok) {
        const error = await res.json()
        setError(error.message || 'Error al procesar la acción')
        return
      }

      setSuccess('Acción aplicada exitosamente')
      loadReports()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError('Error al procesar la acción')
    }
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
        setSuccess(null)
      }, 3000)
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

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Configuración General</h2>
              <p className="text-gray-600">Configuración básica de tu foro</p>
            </div>
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
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Apariencia y Branding</h2>
              <p className="text-gray-600">Personaliza el aspecto visual de tu foro</p>
            </div>
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
        )

      case 'users':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Configuración de Usuarios</h2>
              <p className="text-gray-600">Controla el registro y permisos de usuarios</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
        )

      case 'content':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Configuración de Contenido</h2>
              <p className="text-gray-600">Controla qué tipo de contenido se permite</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
        )

      case 'voting':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Configuración de Votación</h2>
              <p className="text-gray-600">Controla cómo funcionan los votos y el karma</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
        )

      case 'email':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Email y Notificaciones</h2>
              <p className="text-gray-600">Configura las notificaciones por email</p>
            </div>
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
        )

      case 'seo':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">SEO y Analytics</h2>
              <p className="text-gray-600">Mejora el SEO y rastrea visitantes</p>
            </div>
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
        )

      case 'communities':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Comunidades Pendientes</h2>
              <p className="text-gray-600">Gestiona las solicitudes de nuevas comunidades</p>
            </div>

            {loadingCommunities ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : pendingCommunities.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay comunidades pendientes de aprobación</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCommunities.map((community: any) => (
                  <div key={community.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {community.image_url && (
                            <img
                              src={community.image_url}
                              alt={community.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{community.name}</h3>
                            <p className="text-sm text-gray-500">Creado por u/{community.creator_username}</p>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-4">{community.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{community.member_count} miembros</span>
                          <span>•</span>
                          <span>{community.is_public ? 'Pública' : 'Privada'}</span>
                          <span>•</span>
                          <span>Creada {new Date(community.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleCommunityAction(community.id, 'approve')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Estás seguro de rechazar esta comunidad? Esta acción no se puede deshacer.')) {
                              handleCommunityAction(community.id, 'reject')
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'moderation':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Panel de Moderación</h2>
              <p className="text-gray-600">Gestiona los reportes de contenido</p>
            </div>

            {/* Filtros de estado */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setReportStatus('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  reportStatus === 'pending'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendientes ({statusCounts.pending || 0})
              </button>
              <button
                onClick={() => setReportStatus('reviewed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  reportStatus === 'reviewed'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Revisados ({statusCounts.reviewed || 0})
              </button>
              <button
                onClick={() => setReportStatus('resolved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  reportStatus === 'resolved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Resueltos ({statusCounts.resolved || 0})
              </button>
              <button
                onClick={() => setReportStatus('dismissed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  reportStatus === 'dismissed'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Descartados ({statusCounts.dismissed || 0})
              </button>
            </div>

            {loadingReports ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay reportes {reportStatus === 'pending' ? 'pendientes' : `con estado "${reportStatus}"`}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report: any) => (
                  <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Flag className={`w-5 h-5 ${
                            reportStatus === 'pending' ? 'text-red-600' :
                            reportStatus === 'resolved' ? 'text-green-600' :
                            reportStatus === 'dismissed' ? 'text-gray-600' : 'text-yellow-600'
                          }`} />
                          <div>
                            <p className="text-sm text-gray-500">
                              Reportado por <span className="font-semibold">u/{report.reporter?.username || 'Usuario desconocido'}</span>
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(report.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="mb-3">
                          <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            {report.reason}
                          </span>
                        </div>
                        {report.description && (
                          <p className="text-sm text-gray-700 mb-3">{report.description}</p>
                        )}
                        {report.post && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-xs text-gray-500 mb-1">Post reportado:</p>
                            <p className="text-sm font-semibold text-gray-900">{report.post.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Por u/{report.post.author?.username || 'Usuario desconocido'}
                            </p>
                            <Link
                              href={report.post.slug ? `/r/${report.post.slug}` : `/post/${report.post.id}`}
                              className="text-xs text-indigo-600 hover:underline mt-2 inline-block"
                            >
                              Ver post →
                            </Link>
                          </div>
                        )}
                        {report.comment && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-xs text-gray-500 mb-1">Comentario reportado:</p>
                            <p className="text-sm text-gray-700">{report.comment.content ? (report.comment.content.substring(0, 200) + (report.comment.content.length > 200 ? '...' : '')) : `Comentario ID: ${report.comment.id}`}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Por u/{report.comment.author?.username || 'Usuario desconocido'}
                            </p>
                            {report.post && (
                              <Link
                                href={`/post/${report.post.id}#comment-${report.comment.id}`}
                                className="text-xs text-indigo-600 hover:underline mt-2 inline-block"
                              >
                                Ver comentario →
                              </Link>
                            )}
                          </div>
                        )}
                        {report.reviewer && (
                          <p className="text-xs text-gray-500 mt-2">
                            Revisado por u/{report.reviewer.username || 'Admin'} el {report.reviewedAt ? new Date(report.reviewedAt).toLocaleString() : 'N/A'}
                          </p>
                        )}
                        {report.actionTaken && (
                          <p className="text-xs text-gray-500 mt-1">
                            Acción: {report.actionTaken}
                          </p>
                        )}
                      </div>
                    </div>
                    {reportStatus === 'pending' && (
                      <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar este contenido? Esta acción no se puede deshacer.')) {
                              handleReportAction(report.id, 'delete')
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, 'hide')}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Ocultar
                        </button>
                        <button
                          onClick={() => {
                            const actionTaken = prompt('Razón de la advertencia (opcional):')
                            handleReportAction(report.id, 'warn', actionTaken || undefined)
                          }}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Advertir
                        </button>
                        {report.post?.author?.id && (
                          <button
                            onClick={async () => {
                              if (confirm(`¿Estás seguro de banear al usuario u/${report.post?.author?.username}?`)) {
                                const reason = prompt('Razón del ban (opcional):')
                                const duration = prompt('Duración del ban en días (dejar vacío para permanente):')
                                try {
                                  const expiresAt = duration ? new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000) : undefined
                                  const res = await fetch(`/api/users/${report.post.author.id}/ban`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'ban', reason, expiresAt: expiresAt?.toISOString() }),
                                  })
                                  if (res.ok) {
                                    setSuccess('Usuario baneado exitosamente')
                                    handleReportAction(report.id, 'delete', `Usuario baneado: ${reason || 'Sin razón especificada'}`)
                                  } else {
                                    const error = await res.json()
                                    setError(error.message || 'Error al banear usuario')
                                  }
                                } catch (error) {
                                  setError('Error al banear usuario')
                                }
                              }
                            }}
                            className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors flex items-center gap-2 text-sm"
                          >
                            <X className="w-4 h-4" />
                            Banear Usuario
                          </button>
                        )}
                        <button
                          onClick={() => handleReportAction(report.id, 'dismiss')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <X className="w-4 h-4" />
                          Descartar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Historial de Moderación */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Historial de Moderación</h3>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : moderationHistory.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                  <p>No hay historial de moderación</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {moderationHistory.map((item: any) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.action === 'delete' ? 'bg-red-100 text-red-800' :
                              item.action === 'ban' ? 'bg-red-200 text-red-900' :
                              item.action === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                              item.action === 'hide' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.action.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-600">
                              {item.target_type}: {item.target_id}
                            </span>
                          </div>
                          {item.reason && (
                            <p className="text-sm text-gray-700 mb-1">{item.reason}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Por u/{item.moderator_username || 'Admin'} • {new Date(item.created_at).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Seguridad</h2>
              <p className="text-gray-600">Protege tu foro de spam y abusos</p>
            </div>
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </div>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'general', label: 'General', icon: Globe },
              { id: 'appearance', label: 'Apariencia', icon: Palette },
              { id: 'users', label: 'Usuarios', icon: Users },
              { id: 'content', label: 'Contenido', icon: FileText },
              { id: 'voting', label: 'Votación', icon: ThumbsUp },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'seo', label: 'SEO', icon: Search },
              { id: 'security', label: 'Seguridad', icon: Lock },
            ].map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </aside>
      <div className="flex pt-16">
        <DashboardSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 w-full">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="max-w-4xl">
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
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
              >
                {renderSection()}
              </motion.div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
