'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Save, Loader2, CheckCircle, XCircle, Globe, Shield } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [settings, setSettings] = useState({
    siteName: 'Discourse',
    siteDescription: '',
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
      })
    } catch (err: any) {
      console.error('Error cargando settings:', err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      // Actualizar nombre del sitio
      const res1 = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'site_name',
          value: settings.siteName,
          description: 'Nombre del sitio/foro',
        }),
      })

      if (!res1.ok) {
        throw new Error('Error actualizando nombre del sitio')
      }

      // Actualizar descripción del sitio
      if (settings.siteDescription) {
        const res2 = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'site_description',
            value: settings.siteDescription,
            description: 'Descripción del sitio',
          }),
        })

        if (!res2.ok) {
          throw new Error('Error actualizando descripción')
        }
      }

      setSuccess('Configuración guardada exitosamente')
      
      // Recargar la página después de 1 segundo para ver los cambios
      setTimeout(() => {
        window.location.reload()
      }, 1000)
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Administración
          </h1>
          <p className="text-gray-600">
            Gestiona la configuración de tu foro
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Configuración General
              </h2>
              <p className="text-gray-600">Personaliza el nombre y descripción de tu foro</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Nombre del Foro
                </div>
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

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Más opciones de configuración próximamente...</p>
        </div>
      </div>
    </div>
  )
}

