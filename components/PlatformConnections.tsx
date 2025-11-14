'use client'

import { useState, useEffect } from 'react'
import { Twitter, X, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useSocialConnections } from '@/lib/hooks/useSocialConnections'

interface PlatformConnection {
  id: number
  platform: string
  platform_username: string | null
  is_active: boolean
  created_at: string
}

const PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-black' },
  // Próximamente: Instagram, Facebook, LinkedIn
]

export default function PlatformConnections() {
  const { t, language } = useI18n()
  const [connections, setConnections] = useState<PlatformConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  // OPTIMIZACIÓN: Usar SWR para obtener conexiones
  const { connections: connectionsData, isLoading: connectionsLoading, mutate } = useSocialConnections()
  
  useEffect(() => {
    if (connectionsData) {
      setConnections(connectionsData)
      setLoading(false)
    }
  }, [connectionsData])
  
  useEffect(() => {
    setLoading(connectionsLoading)
  }, [connectionsLoading])

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId)
    try {
      // Redirigir al endpoint de OAuth
      window.location.href = `/api/auth/${platformId}`
    } catch (error) {
      alert('Error connecting platform')
      setConnecting(null)
    }
  }

  const handleDisconnect = async (platform: string) => {
    if (!confirm(language === 'es' ? '¿Desconectar esta plataforma?' : 'Disconnect this platform?')) {
      return
    }

    try {
      const res = await fetch(`/api/social/connections?platform=${platform}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        // Revalidar conexiones usando SWR
        mutate()
        alert(language === 'es' ? 'Plataforma desconectada' : 'Platform disconnected')
      }
    } catch (error) {
      alert('Error disconnecting platform')
    }
  }


  const getConnection = (platformId: string) => {
    return connections.find(c => c.platform === platformId)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">
        {language === 'es' ? 'Conexiones con Plataformas' : 'Platform Connections'}
      </h2>
      <p className="text-sm text-gray-600">
        {language === 'es' 
          ? 'Conecta tus cuentas de redes sociales para compartir posts y actualizar tu perfil'
          : 'Connect your social media accounts to share posts and update your profile'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {PLATFORMS.map(platform => {
          const Icon = platform.icon
          const connection = getConnection(platform.id)
          const isConnecting = connecting === platform.id

          return (
            <div
              key={platform.id}
              className={`border-2 rounded-lg p-4 ${
                connection?.is_active
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`${platform.color} p-2 rounded-lg text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                    {connection?.platform_username && (
                      <p className="text-sm text-gray-600">@{connection.platform_username}</p>
                    )}
                  </div>
                </div>
                {connection?.is_active && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {language === 'es' ? 'Conectado' : 'Connected'}
                    </span>
                  </div>
                )}
              </div>

              {!connection ? (
                <button
                  onClick={() => handleConnect(platform.id)}
                  disabled={isConnecting}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting
                    ? (language === 'es' ? 'Conectando...' : 'Connecting...')
                    : (language === 'es' ? 'Conectar' : 'Connect')}
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>{language === 'es' ? 'Desconectar' : 'Disconnect'}</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

