'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Bookmark, BookmarkCheck, EyeOff, Edit, Trash2, Flag } from 'lucide-react'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PostContentRenderer from './PostContentRenderer'
import RichTextEditor from './RichTextEditor'
import { useI18n } from '@/lib/i18n/context'
import { useBehaviorTracking, useViewTracking } from '@/hooks/useBehaviorTracking'
import SharePostButton from './SharePostButton'
import AdminBadge from './AdminBadge'
import { X } from 'lucide-react'
import { useSettings } from '@/lib/hooks/useSettings'
import { usePost } from '@/lib/hooks/usePosts'
import { useUser } from '@/lib/hooks/useUser'
import { mutate } from 'swr'

interface PostCardProps {
  id: string
  title: string
  content: string
  author: string
  forum: string
  subforum?: string
  postSlug?: string
  upvotes: number
  comments: number
  createdAt: string | Date
  editedAt?: string | Date | null
  isHot?: boolean
  isNew?: boolean
  isFromMemberCommunity?: boolean
  userVote?: 'up' | 'down' | null
  canEdit?: boolean
  canDelete?: boolean
  onDelete?: (postId: string) => void
}

export default function PostCard({
  id,
  title,
  content,
  author,
  forum,
  subforum,
  postSlug,
  upvotes,
  comments,
  createdAt,
  isHot = false,
  isNew = false,
  isFromMemberCommunity = false,
  userVote = null,
  canEdit = false,
  canDelete = false,
  editedAt = null,
  onDelete,
}: PostCardProps) {
  const { settings } = useSettings()
  const { t } = useI18n()
  const { trackBehavior } = useBehaviorTracking()
  const router = useRouter()
  const postIdNum = parseInt(id)
  const startTimeRef = useRef<number | null>(null)
  
  const [vote, setVote] = useState<'up' | 'down' | null>(userVote)
  const [voteCount, setVoteCount] = useState(upvotes)
  const [timeAgo, setTimeAgo] = useState(t.common.seconds)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const [editContent, setEditContent] = useState(content)
  const [isEditing, setIsEditing] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const { user } = useUser()
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hiding, setHiding] = useState(false)

  // Verificar si el post está guardado
  useEffect(() => {
    if (user) {
      fetch(`/api/posts/${id}/save`)
        .then(res => res.json())
        .then(data => setIsSaved(data.saved || false))
        .catch(() => {})
    }
  }, [user, id])

  useEffect(() => {
    setVote(userVote)
  }, [userVote])

  // Trackear visualización del post en el feed (optimizado - solo una vez)
  useEffect(() => {
    if (!isNaN(postIdNum)) {
      startTimeRef.current = Date.now()
      
      // Trackear view inicial (el sistema de batching manejará la frecuencia)
      trackBehavior({
        postId: postIdNum,
        actionType: 'view',
      })

      // Trackear duración final solo si el usuario pasó tiempo significativo (> 10 segundos)
      return () => {
        if (startTimeRef.current) {
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
          if (duration >= 10) {
            trackBehavior({
              postId: postIdNum,
              actionType: 'view',
              durationSeconds: duration,
              metadata: { final: true, source: 'feed' },
            })
          }
        }
      }
    }
  }, [postIdNum, trackBehavior])

  // OPTIMIZACIÓN: useCallback para evitar recrear función en cada render
  const calculateTimeAgo = useCallback((date: string | Date): string => {
    const now = new Date()
    const postDate = new Date(date)
    const diff = now.getTime() - postDate.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return t.common.seconds
    if (minutes < 60) return `${t.post.ago} ${minutes} ${minutes > 1 ? t.common.minutes : t.common.minutes.slice(0, -1)}`
    if (hours < 24) return `${t.post.ago} ${hours} ${hours > 1 ? t.common.hours : t.common.hours.slice(0, -1)}`
    return `${t.post.ago} ${days} ${days > 1 ? t.common.days : t.common.days.slice(0, -1)}`
  }, [t])

  // OPTIMIZACIÓN: useMemo para calcular timeAgo inicial
  const initialTimeAgo = useMemo(() => calculateTimeAgo(createdAt), [createdAt, calculateTimeAgo])
  
  // Actualizar el tiempo dinámicamente
  useEffect(() => {
    setTimeAgo(initialTimeAgo)
    
    // Para posts muy recientes (< 1 hora), actualizar cada 30 segundos
    // Para posts más antiguos, actualizar cada minuto
    const postDate = new Date(createdAt)
    const now = new Date()
    const diff = now.getTime() - postDate.getTime()
    const hours = diff / (1000 * 60 * 60)
    
    const intervalTime = hours < 1 ? 30000 : 60000 // 30 segundos si < 1 hora, 1 minuto si >= 1 hora
    
    const interval = setInterval(() => {
      setTimeAgo(calculateTimeAgo(createdAt))
    }, intervalTime)

    return () => clearInterval(interval)
  }, [createdAt, calculateTimeAgo, initialTimeAgo])

  const handleEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert(t.post.title + ' y ' + t.post.content + ' son requeridos')
      return
    }

    setIsEditing(true)
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), content: editContent.trim() }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al editar el post')
      }

      setShowEditModal(false)
      // Recargar la página para mostrar los cambios
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al editar el post')
    } finally {
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al eliminar el post')
      }

      // Si hay callback, llamarlo para eliminar del estado inmediatamente
      if (onDelete) {
        onDelete(id)
      } else {
        // Si no hay callback, redirigir (fallback)
        router.push('/feed')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar el post')
      setIsDeleting(false)
    }
  }

  const handleVote = async (type: 'up' | 'down') => {
    // Trackear voto (acción prioritaria - se procesará inmediatamente si hay batch lleno)
    if (!isNaN(postIdNum)) {
      trackBehavior({
        postId: postIdNum,
        actionType: 'vote',
        metadata: { voteType: type },
      })
    }
    try {
      const res = await fetch(`/api/posts/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType: type }),
      })

      if (!res.ok) {
        const error = await res.json()
        if (error.message?.includes('sesión') || error.message?.includes('session')) {
          alert(t.auth.signIn)
          return
        }
        throw new Error(error.message || 'Error al votar')
      }

      const data = await res.json()
      
      // Actualizar el estado del voto
      setVote(data.voteType)
      
      // OPTIMIZACIÓN: Revalidar usando SWR mutate en lugar de fetch manual
      mutate(`/api/posts/${id}`).then((postData: any) => {
        if (postData?.id) {
          setVoteCount(postData.upvotes - postData.downvotes)
          // Asegurar que el voto se mantenga sincronizado
          setVote(postData.userVote || data.voteType)
        }
      }).catch(() => {})
    } catch (error) {
    }
  }

  return (
    <motion.article
      className={`rounded-lg border shadow-sm transition-colors overflow-hidden ${
        isFromMemberCommunity
          ? 'bg-primary-50 border-primary-200 hover:border-primary-300'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex">
        {/* Content Section */}
        <div className="flex-1 p-2 sm:p-4 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
            <Link
              href={`/r/${forum}`}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 truncate"
            >
              r/{forum}
            </Link>
            <span className="text-gray-600 hidden sm:inline">•</span>
            <span className="text-xs text-gray-500 hidden sm:inline">{t.post.postedBy}</span>
            <Link href={`/user/${author}`} className="text-xs font-semibold text-gray-700 hover:text-gray-900 truncate flex items-center gap-1">
              <span className="hidden sm:inline">u/</span>
              <span>{author}</span>
              <AdminBadge username={author} />
            </Link>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo}</span>
            {editedAt && (
              <>
                <span className="text-gray-600 hidden sm:inline">•</span>
                <span className="text-xs text-gray-500 italic">
                  {t.post.edited} {new Date(editedAt).toLocaleDateString()}
                </span>
              </>
            )}
            {(isHot || isNew) && (
              <>
                <span className="text-gray-600 hidden sm:inline">•</span>
                {isHot && (
                  <span className="text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold whitespace-nowrap">
                    🔥 {t.post.hot}
                  </span>
                )}
                {isNew && (
                  <span className="text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold whitespace-nowrap">
                    ✨ {t.post.new}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Title */}
          <Link 
            href={postSlug && subforum ? `/r/${subforum}/${postSlug}` : `/post/${id}`}
            onClick={() => {
              if (!isNaN(postIdNum)) {
                trackBehavior({
                  postId: postIdNum,
                  actionType: 'click',
                  metadata: { target: 'title' },
                })
              }
            }}
            className="block mb-1.5 sm:mb-2"
          >
            <h2 className="text-sm sm:text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors cursor-pointer line-clamp-2 sm:line-clamp-2">
              {title}
            </h2>
          </Link>

              {/* Content Preview */}
              <div className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3">
                <PostContentRenderer content={content} />
              </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 sm:gap-4 flex-wrap">
              <Link
                href={postSlug && subforum ? `/r/${subforum}/${postSlug}` : `/post/${id}`}
                onClick={() => {
                  if (!isNaN(postIdNum)) {
                    trackBehavior({
                      postId: postIdNum,
                      actionType: 'click',
                      metadata: { target: 'comments' },
                    })
                  }
                }}
                className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors text-[10px] sm:text-sm"
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{comments} {t.post.comments}</span>
                <span className="sm:hidden">{comments}</span>
              </Link>
              <SharePostButton
                postId={postIdNum}
                postTitle={title}
                postUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}${postSlug && subforum ? `/r/${subforum}/${postSlug}` : `/post/${id}`}`}
                onShareComplete={() => {
                  if (!isNaN(postIdNum)) {
                    trackBehavior({
                      postId: postIdNum,
                      actionType: 'share',
                      metadata: { source: 'postcard' },
                    })
                  }
                }}
              />
              {user && (
                <>
                  <button 
                    onClick={async () => {
                      if (saving) return
                      setSaving(true)
                      try {
                        const res = await fetch(`/api/posts/${id}/save`, { method: 'POST' })
                        const data = await res.json()
                        setIsSaved(data.saved)
                        if (!isNaN(postIdNum)) {
                          trackBehavior({
                            postId: postIdNum,
                            actionType: 'save',
                          })
                        }
                      } catch (error) {
                        alert('Error al guardar el post')
                      } finally {
                        setSaving(false)
                      }
                    }}
                    disabled={saving}
                    className={`flex items-center gap-1 transition-colors text-[10px] sm:text-sm ${
                      isSaved 
                        ? 'text-primary-600 hover:text-primary-700' 
                        : 'text-gray-600 hover:text-yellow-600'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isSaved ? 'Desguardar' : 'Guardar'}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    ) : (
                      <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    <span className="hidden sm:inline">{isSaved ? 'Guardado' : t.post.save}</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (hiding) return
                      setHiding(true)
                      try {
                        const res = await fetch(`/api/posts/${id}/hide`, { method: 'POST' })
                        const data = await res.json()
                        if (data.hidden && onDelete) {
                          onDelete(id)
                        }
                      } catch (error) {
                        alert('Error al ocultar el post')
                      } finally {
                        setHiding(false)
                      }
                    }}
                    disabled={hiding}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors text-[10px] sm:text-sm"
                    title="Ocultar"
                  >
                    <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(canEdit || canDelete) && (
                <>
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowEditModal(true)
                      }}
                      className="text-xs text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
                      title={t.post.edit}
                    >
                      <Edit className="w-3 h-3" />
                      <span className="hidden sm:inline">{t.post.edit}</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowDeleteModal(true)
                      }}
                      className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
                      title={t.post.delete}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">{t.post.delete}</span>
                    </button>
                  )}
                </>
              )}
              {user && author !== user.username && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowReportModal(true)
                    setReportReason('')
                    setReportDescription('')
                  }}
                  className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
                  title="Reportar post"
                >
                  <Flag className="w-3 h-3" />
                  <span className="hidden sm:inline">Reportar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Vote Section - Right Side */}
        <div className="flex flex-col items-center justify-center p-1 sm:p-2 bg-gray-50 rounded-r-lg min-w-[44px] sm:min-w-[56px]">
          <motion.button
            onClick={() => handleVote('up')}
            className={`p-1 sm:p-2 rounded-lg transition-all ${
              vote === 'up' 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Me gusta"
          >
            <ThumbsUp className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${vote === 'up' ? 'fill-current' : ''}`} />
          </motion.button>
          {settings.showVoteCounts && (
            <span className={`text-[10px] sm:text-sm font-bold py-0.5 sm:py-1.5 leading-tight ${
              vote === 'up' ? 'text-green-600' : vote === 'down' ? 'text-red-600' : 'text-gray-700'
            }`}>
              {voteCount}
            </span>
          )}
          {settings.allowDownvotes && (
            <motion.button
              onClick={() => handleVote('down')}
              className={`p-1 sm:p-2 rounded-lg transition-all ${
                vote === 'down' 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="No me gusta"
            >
              <ThumbsDown className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${vote === 'down' ? 'fill-current' : ''}`} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{t.post.edit}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.post.title}
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.post.content}
                  </label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                    <RichTextEditor
                      value={editContent}
                      onChange={setEditContent}
                      placeholder={t.post.writePost}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                disabled={isEditing}
              >
                {t.post.cancel}
              </button>
              <button
                onClick={handleEdit}
                disabled={isEditing || !editTitle.trim() || !editContent.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditing ? t.post.editing : t.post.save}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t.post.confirmDelete}</h2>
            <p className="text-gray-600 mb-6">{t.post.confirmDeletePost}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                disabled={isDeleting}
              >
                {t.post.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? t.post.deleting : t.post.delete}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de reporte */}
      <AnimatePresence>
        {showReportModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowReportModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Reportar Post</h2>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razón del reporte *
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecciona una razón</option>
                      <option value="Spam">Spam</option>
                      <option value="Contenido inapropiado">Contenido inapropiado</option>
                      <option value="Acoso">Acoso</option>
                      <option value="Información falsa">Información falsa</option>
                      <option value="Violación de derechos">Violación de derechos</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Proporciona más detalles sobre el reporte..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    disabled={isReporting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!reportReason.trim() || isReporting) return
                      setIsReporting(true)
                      try {
                        const res = await fetch('/api/reports/create', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            postId: postIdNum,
                            reason: reportReason,
                            description: reportDescription.trim() || null,
                          }),
                        })

                        if (!res.ok) {
                          const error = await res.json()
                          throw new Error(error.message || 'Error al reportar')
                        }

                        alert('Reporte enviado exitosamente. Será revisado por los moderadores.')
                        setShowReportModal(false)
                        setReportReason('')
                        setReportDescription('')
                      } catch (error) {
                        alert(error instanceof Error ? error.message : 'Error al reportar')
                      } finally {
                        setIsReporting(false)
                      }
                    }}
                    disabled={!reportReason.trim() || isReporting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReporting ? 'Enviando...' : 'Enviar Reporte'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

