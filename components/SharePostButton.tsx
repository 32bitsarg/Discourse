'use client'

import { useState } from 'react'
import { Share2, Twitter, X, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface SharePostButtonProps {
  postId: number
  postTitle: string
  postUrl: string
  onShareComplete?: () => void
}

const PLATFORMS = [
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-black' },
  // Próximamente: Facebook, LinkedIn
]

export default function SharePostButton({ postId, postTitle, postUrl, onShareComplete }: SharePostButtonProps) {
  const { t, language } = useI18n()
  const [showModal, setShowModal] = useState(false)
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState<string | null>(null)
  const [shareMessage, setShareMessage] = useState('')
  const [sharedPlatforms, setSharedPlatforms] = useState<Set<string>>(new Set())

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/social/connections')
      const data = await res.json()
      setConnections(data.connections?.filter((c: any) => c.is_active) || [])
    } catch (error) {
    }
  }

  const handleOpen = () => {
    setShowModal(true)
    loadConnections()
  }

  const handleShare = async (platform: string) => {
    if (sharing) return

    setSharing(platform)
    try {
      const res = await fetch('/api/social/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          platform,
          message: shareMessage || postTitle
        })
      })

      const data = await res.json()

      if (data.success) {
        setSharedPlatforms(new Set([...sharedPlatforms, platform]))
        if (onShareComplete) {
          onShareComplete()
        }
        setTimeout(() => {
          setSharedPlatforms(new Set())
        }, 3000)
      } else {
        alert(data.error || (language === 'es' ? 'Error al compartir' : 'Error sharing'))
      }
    } catch (error) {
      alert(language === 'es' ? 'Error al compartir' : 'Error sharing')
    } finally {
      setSharing(null)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: postTitle,
          url: postUrl
        })
        if (onShareComplete) {
          onShareComplete()
        }
      } catch (error) {
        // Usuario canceló o error
      }
    } else {
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(postUrl)
        alert(language === 'es' ? 'URL copiada al portapapeles' : 'URL copied to clipboard')
      } catch (error) {
        alert(language === 'es' ? 'Error al copiar' : 'Error copying')
      }
    }
  }

  const availablePlatforms = PLATFORMS.filter(p => 
    connections.some(c => c.platform === p.id)
  )

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span className="text-sm">{t.post.share}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {language === 'es' ? 'Compartir Post' : 'Share Post'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'es' ? 'Mensaje (opcional)' : 'Message (optional)'}
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder={postTitle}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {availablePlatforms.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {language === 'es' ? 'Compartir a:' : 'Share to:'}
                  </p>
                  <div className="space-y-2">
                    {availablePlatforms.map(platform => {
                      const Icon = platform.icon
                      const isSharing = sharing === platform.id
                      const isShared = sharedPlatforms.has(platform.id)

                      return (
                        <button
                          key={platform.id}
                          onClick={() => handleShare(platform.id)}
                          disabled={isSharing || isShared}
                          className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-lg transition-all ${
                            isShared
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-5 h-5 ${platform.color}`} />
                            <span className="font-medium text-gray-900">{platform.name}</span>
                          </div>
                          {isSharing ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          ) : isShared ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-4">
                    {language === 'es' 
                      ? 'No tienes plataformas conectadas. Conecta una en tu perfil.'
                      : 'No platforms connected. Connect one in your profile.'}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleNativeShare}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>
                    {language === 'es' ? 'Compartir con...' : 'Share with...'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

