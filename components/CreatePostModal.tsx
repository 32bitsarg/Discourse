'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import RichTextEditor from './RichTextEditor'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { title: string; content: string; subforumId: number }) => Promise<void>
  defaultSubforumId?: number
}

export default function CreatePostModal({ isOpen, onClose, onSubmit, defaultSubforumId }: CreatePostModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subforumId, setSubforumId] = useState<number | null>(defaultSubforumId || null)
  const [subforums, setSubforums] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // OPTIMIZACIÓN: Usar SWR para obtener comunidades
  const { subforums: userCommunities } = useMyCommunities()
  
  useEffect(() => {
    if (isOpen) {
      setSubforums(userCommunities)
      if (defaultSubforumId) {
        setSubforumId(defaultSubforumId)
      } else if (userCommunities.length > 0) {
        setSubforumId(userCommunities[0].id)
      }
    }
  }, [isOpen, defaultSubforumId, userCommunities])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !content.trim()) {
      setError('El título y contenido son requeridos')
      return
    }

    if (!subforumId) {
      setError('Debes seleccionar una comunidad')
      return
    }

    setLoading(true)
    try {
      const finalSubforumId = defaultSubforumId || subforumId
      await onSubmit({ title: title.trim(), content: content.trim(), subforumId: finalSubforumId! })
      setTitle('')
      setContent('')
      if (!defaultSubforumId) {
        setSubforumId(null)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el post')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white shadow-xl w-full h-full flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900">Crear Publicación</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Content area - no scroll, fixed layout */}
            <div className="flex-1 flex flex-col px-6 py-4 min-h-0">
              <div className="flex flex-col flex-1 min-h-0 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex-shrink-0">
                    {error}
                  </div>
                )}

                {/* Comunidad */}
                {!defaultSubforumId && (
                  <div className="flex-shrink-0">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Comunidad
                    </label>
                    {subforums.length === 0 ? (
                      <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                        No perteneces a ninguna comunidad. Únete a una comunidad primero para poder crear publicaciones.
                      </div>
                    ) : (
                      <select
                        value={subforumId || ''}
                        onChange={(e) => setSubforumId(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Selecciona una comunidad</option>
                        {subforums.map((subforum) => (
                          <option key={subforum.id} value={subforum.id}>
                            r/{subforum.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Título */}
                <div className="flex-shrink-0">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Escribe un título atractivo..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                    maxLength={255}
                  />
                  <p className="text-xs text-gray-500 mt-1">{title.length}/255 caracteres</p>
                </div>

                {/* Contenido - takes remaining space */}
                <div className="flex flex-col flex-1 min-h-0">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex-shrink-0">
                    Contenido
                  </label>
                  <div className="flex-1 min-h-0">
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      placeholder="Escribe tu publicación aquí... Puedes usar formato, imágenes y videos."
                      rows={20}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <motion.button
                type="submit"
                disabled={loading || !title.trim() || !content.trim() || !subforumId}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  'Publicando...'
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publicar
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

