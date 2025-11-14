'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Image as ImageIcon, Video, X, Send, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useSettings } from '@/lib/hooks/useSettings'
import { useUser } from '@/lib/hooks/useUser'
import { useMyCommunities } from '@/lib/hooks/useSubforums'
import Recaptcha from './Recaptcha'

interface CreatePostBoxProps {
  defaultSubforumId?: number
  onPostCreated?: () => void
}

export default function CreatePostBox({ defaultSubforumId, onPostCreated }: CreatePostBoxProps) {
  const { settings } = useSettings()
  const { t } = useI18n()
  // OPTIMIZACIÓN: Usar SWR para obtener datos
  const { user } = useUser()
  const { subforums: userCommunities } = useMyCommunities()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('') // Contenido completo con imágenes
  const [displayContent, setDisplayContent] = useState('') // Contenido visible en textarea (sin imágenes)
  const [subforumId, setSubforumId] = useState<number | null>(defaultSubforumId || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCommunitySelector, setShowCommunitySelector] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  // Obtener captchaRequired de settings
  const captchaRequired = settings.captcha_on_posts || false

  // Establecer subforumId cuando cambian las comunidades o defaultSubforumId
  useEffect(() => {
    if (defaultSubforumId) {
      setSubforumId(defaultSubforumId)
    } else if (userCommunities.length > 0 && !subforumId) {
      setSubforumId(userCommunities[0].id)
    }
  }, [defaultSubforumId, userCommunities, subforumId])

  // OPTIMIZACIÓN: useCallback para evitar recrear funciones en cada render
  // Función para actualizar el contenido visible (sin imágenes) y el contenido completo
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent)
    // Remover imágenes del contenido visible (mantener solo el texto)
    const contentWithoutImages = newContent.replace(/!\[([^\]]*)\]\([^)]+\)/g, '').replace(/<video[^>]*>.*?<\/video>/g, '').trim()
    setDisplayContent(contentWithoutImages)
  }, [])

  // Función para actualizar solo el texto visible, manteniendo las imágenes en el contenido completo
  const updateDisplayContent = useCallback((newText: string) => {
    setDisplayContent(newText)
    // Usar el estado actual de content para extraer imágenes y videos
    setContent(prevContent => {
      const images = prevContent.match(/!\[([^\]]*)\]\([^)]+\)/g) || []
      const videos = prevContent.match(/<video[^>]*>.*?<\/video>/g) || []
      // Reconstruir el contenido: texto nuevo + imágenes + videos
      const mediaContent = [...images, ...videos].join('\n')
      return newText.trim() + (mediaContent ? '\n' + mediaContent : '')
    })
  }, [])

  useEffect(() => {
    // Mostrar selector de comunidad cuando hay contenido o está enfocado o interactuando o el select está abierto
    if (isFocused || content.trim() || displayContent.trim() || title.trim() || isInteracting || isSelectOpen) {
      setShowCommunitySelector(true)
    } else {
      // Delay para permitir clicks en elementos del formulario
      const timer = setTimeout(() => {
        if (!isFocused && !content.trim() && !displayContent.trim() && !title.trim() && !isInteracting && !isSelectOpen) {
          setShowCommunitySelector(false)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isFocused, content, displayContent, title, isInteracting, isSelectOpen])

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleVideoUpload = () => {
    videoInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg']
    
    if (type === 'image') {
      if (!file.type.startsWith('image/') || !allowedImageTypes.includes(file.type)) {
        alert('Por favor selecciona una imagen válida (JPEG, PNG, GIF o WebP)')
        e.target.value = ''
        return
      }
      // Validar tamaño máximo: 5MB para imágenes
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        alert('La imagen es demasiado grande. El tamaño máximo es 5MB. Por favor comprime la imagen o usa una de menor resolución.')
        e.target.value = ''
        return
      }
    }
    
    if (type === 'video') {
      if (!file.type.startsWith('video/') || !allowedVideoTypes.includes(file.type)) {
        alert('Por favor selecciona un video válido (MP4, WebM u OGG)')
        e.target.value = ''
        return
      }
      // Validar tamaño máximo: 50MB para videos
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        alert('El video es demasiado grande. El tamaño máximo es 50MB.')
        e.target.value = ''
        return
      }
    }

    // Mostrar indicador de carga
    setLoading(true)
    setError('')

    try {
      // Comprimir imagen antes de convertir a base64 (solo para imágenes)
      if (type === 'image') {
        await compressAndAddImage(file)
      } else {
        // Para videos, usar directamente (pero advertir sobre el tamaño)
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          // Limpiar saltos de línea del base64
          const cleanBase64 = base64.replace(/\s+/g, '').trim()
          
          // Si el base64 es muy grande, advertir
          if (cleanBase64.length > 10 * 1024 * 1024) { // ~10MB en base64
            alert('Advertencia: El video es muy grande. Esto puede afectar el rendimiento. Considera usar un enlace externo en su lugar.')
          }
          const videoTag = `\n<video src="${cleanBase64}" controls class="max-w-full"></video>\n`
          updateContent(content + videoTag)
          setLoading(false)
        }
        reader.onerror = () => {
          setError('Error al leer el archivo')
          setLoading(false)
        }
        reader.readAsDataURL(file)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al procesar el archivo')
      setLoading(false)
    }
    
    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = ''
  }

  const compressAndAddImage = async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          // Calcular dimensiones máximas (1920x1080 para mantener calidad pero reducir tamaño)
          const maxWidth = 1920
          const maxHeight = 1080
          let width = img.width
          let height = img.height

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = width * ratio
            height = height * ratio
          }

          // Crear canvas para redimensionar
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('No se pudo crear el contexto del canvas'))
            return
          }

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convertir a base64 con calidad 0.85 (balance entre calidad y tamaño)
          const base64 = canvas.toDataURL('image/jpeg', 0.85)
          
          // Verificar tamaño final (si sigue siendo muy grande, reducir calidad)
          // Asegurar que el base64 esté en una sola línea (sin saltos de línea)
          const cleanBase64 = base64.replace(/\s+/g, '').trim()
          
          if (cleanBase64.length > 2 * 1024 * 1024) { // Si es mayor a 2MB
            const lowerQualityBase64 = canvas.toDataURL('image/jpeg', 0.7).replace(/\s+/g, '').trim()
            const imgTag = `\n![${file.name}](${lowerQualityBase64})\n`
            updateContent(content + imgTag)
          } else {
            const imgTag = `\n![${file.name}](${cleanBase64})\n`
            updateContent(content + imgTag)
          }
          
          setLoading(false)
          resolve()
        }
        img.onerror = () => {
          reject(new Error('Error al cargar la imagen'))
        }
        img.src = event.target?.result as string
      }
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      alert(t.post.create)
      return
    }

    if (!content.trim()) {
      setError(t.common.error)
      return
    }

    if (!subforumId) {
      setError(t.community.notFound)
      return
    }

    // Verificar CAPTCHA si está requerido
    if (captchaRequired && !captchaToken) {
      setError('Por favor completa la verificación CAPTCHA')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title.trim(), 
          content: content.trim(), 
          subforumId,
          captchaToken: captchaToken || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || t.common.error)
      }

      // Limpiar formulario
      setTitle('')
      setContent('')
      setDisplayContent('')
      setIsFocused(false)
      setShowCommunitySelector(false)
      setCaptchaToken(null)
      
      // Notificar al componente padre para actualizar el feed
      if (onPostCreated) {
        onPostCreated()
      } else {
        // Fallback: recargar solo si no hay callback
        window.location.reload()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center text-gray-500">
        <p>{t.post.loginToCreatePost}</p>
      </div>
    )
  }

  return (
    <motion.div
      ref={containerRef}
      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
      initial={false}
    >
      <form onSubmit={handleSubmit} className="p-3 sm:p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Selector de Comunidad - aparece cuando hay contenido o está enfocado */}
        {showCommunitySelector && !defaultSubforumId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.community.communities}
            </label>
            {subforums.length === 0 ? (
              <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                {t.community.noCommunities}
              </div>
            ) : (
              <select
                ref={selectRef}
                value={subforumId || ''}
                onChange={(e) => {
                  setSubforumId(Number(e.target.value))
                  setIsInteracting(true)
                  setIsSelectOpen(false)
                }}
                onMouseDown={(e) => {
                  // Prevenir que el blur del textarea cierre el selector
                  e.stopPropagation()
                  setIsSelectOpen(true)
                  setIsInteracting(true)
                  setIsFocused(true)
                }}
                onFocus={() => {
                  setIsSelectOpen(true)
                  setIsInteracting(true)
                  setIsFocused(true)
                }}
                onBlur={() => {
                  // Delay más largo para permitir que el select se abra completamente
                  setTimeout(() => {
                    const activeElement = document.activeElement
                    // Si el focus está en otro elemento del formulario, mantener abierto
                    if (containerRef.current?.contains(activeElement)) {
                      setIsSelectOpen(false)
                      setIsInteracting(true)
                    } else {
                      // Solo cerrar si realmente se perdió el focus y no hay contenido
                      setIsSelectOpen(false)
                      if (!content.trim() && !title.trim() && !isFocused) {
                        setIsInteracting(false)
                      }
                    }
                  }, 400)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">{t.post.selectCommunity}</option>
                {userCommunities.map((subforum: any) => (
                  <option key={subforum.id} value={subforum.id}>
                    r/{subforum.name}
                  </option>
                ))}
              </select>
            )}
          </motion.div>
        )}

        {/* Título - aparece cuando hay contenido o está enfocado */}
        {showCommunitySelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => {
                setIsInteracting(true)
                setIsFocused(true)
              }}
              onBlur={() => {
                setTimeout(() => {
                  const activeElement = document.activeElement
                  if (!containerRef.current?.contains(activeElement)) {
                    if (!content.trim() && !title.trim()) {
                      setIsInteracting(false)
                      setIsFocused(false)
                    }
                  }
                }, 200)
              }}
              placeholder={t.post.title}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              maxLength={255}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/255 {t.common.characters}</p>
          </motion.div>
        )}

        {/* Área de texto principal */}
        <div className="mb-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={displayContent}
              onChange={(e) => {
                // Cuando el usuario escribe, actualizar solo el texto visible
                updateDisplayContent(e.target.value)
              }}
              onFocus={() => {
                setIsFocused(true)
                setIsInteracting(true)
              }}
              onBlur={(e) => {
                // Delay más largo para permitir clicks en botones y selects
                setTimeout(() => {
                  // Verificar si el focus está en algún elemento del formulario
                  const activeElement = document.activeElement
                  // Si el siguiente elemento en focus es el select o el input de título, mantener abierto
                  if (activeElement && containerRef.current?.contains(activeElement)) {
                    setIsInteracting(true)
                    // Si es el select o el input, mantener el focus
                    if (activeElement.tagName === 'SELECT' || activeElement.tagName === 'INPUT') {
                      setIsFocused(true)
                      // Si es el select, marcarlo como abierto
                      if (activeElement.tagName === 'SELECT') {
                        setIsSelectOpen(true)
                      }
                    }
                  } else {
                    // Solo cerrar si no hay contenido y el select no está abierto
                    if (!content.trim() && !displayContent.trim() && !title.trim() && !isSelectOpen) {
                      setIsFocused(false)
                      setIsInteracting(false)
                    }
                  }
                }, 300)
              }}
              placeholder={t.post.whatAreYouThinking}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
              rows={3}
            />
          </div>
          
          {/* Preview de imágenes */}
          {(() => {
            // Extraer todas las imágenes del contenido
            const imageMatches = content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []
            const images: Array<{ alt: string; src: string; fullMatch: string }> = []
            
            imageMatches.forEach(match => {
              const imgMatch = match.match(/!\[([^\]]*)\]\(([^)]+)\)/)
              if (imgMatch) {
                const [, alt, src] = imgMatch
                const cleanSrc = src.replace(/\s+/g, '').trim()
                if (cleanSrc.startsWith('data:image/')) {
                  images.push({ alt: alt || t.common.loading, src: cleanSrc, fullMatch: match })
                }
              }
            })
            
            if (images.length === 0) return null
            
            return (
              <div className="mt-3 space-y-2">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        // Eliminar esta imagen del contenido
                        const newContent = content.replace(img.fullMatch, '').trim()
                        updateContent(newContent)
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title={t.common.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            {settings.allowImagesInPosts && (
              <button
                type="button"
                onClick={handleImageUpload}
                className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-primary-600 transition-colors px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-50"
              >
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">{t.editor.imageUrl}</span>
              </button>
            )}
            {settings.allowVideosInPosts && (
              <button
                type="button"
                onClick={handleVideoUpload}
                className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-green-600 transition-colors px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-50"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">{t.editor.videoUrl}</span>
              </button>
            )}
          </div>

          {/* CAPTCHA si está requerido */}
          {captchaRequired && (content.trim() || displayContent.trim() || title.trim()) && (
            <div className="w-full py-2">
              <Recaptcha 
                onVerify={(token) => setCaptchaToken(token)} 
                onError={() => setError('Error al verificar CAPTCHA')} 
              />
            </div>
          )}

          {/* Botón publicar - aparece cuando hay contenido */}
          {(content.trim() || displayContent.trim() || title.trim()) && (
            <motion.button
              type="submit"
              disabled={loading || !content.trim() || !subforumId || (captchaRequired && !captchaToken)}
              className="px-4 sm:px-6 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <span className="hidden sm:inline">{t.post.publishing}</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t.post.publish}</span>
                  <span className="sm:hidden">{t.post.publish}</span>
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* Inputs ocultos para archivos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e, 'image')}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileChange(e, 'video')}
        />
      </form>
    </motion.div>
  )
}

