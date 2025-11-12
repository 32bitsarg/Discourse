'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MessageCircle, Send, ThumbsUp, ThumbsDown, Edit, Trash2, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking'

interface Comment {
  id: number
  content: string
  author_username: string
  author_id?: number
  upvotes: number
  downvotes: number
  created_at: string
  edited_at?: string
  canEdit?: boolean
  canDelete?: boolean
  replies?: Comment[]
}

interface CommentsSectionProps {
  postId: number
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const { t } = useI18n()
  const { trackBehavior } = useBehaviorTracking()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<{ id: number; username: string } | null>(null)

  useEffect(() => {
    if (!postId || postId <= 0) {
      console.warn('CommentsSection: postId inválido:', postId)
      return
    }

    // Verificar usuario
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})

    // Cargar comentarios
    loadComments()
  }, [postId])

  const loadComments = async () => {
    if (!postId || postId <= 0) {
      console.warn('loadComments: postId inválido:', postId)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      console.log(`[CommentsSection] Cargando comentarios para post ${postId}`)
      const res = await fetch(`/api/posts/${postId}/comments`)
      if (!res.ok) {
        console.error('Error en la respuesta:', res.status, res.statusText)
        const errorData = await res.json().catch(() => ({}))
        console.error('Detalles del error:', errorData)
        setComments([])
        return
      }
      const data = await res.json()
      console.log(`[CommentsSection] Comentarios recibidos para post ${postId}:`, data)
      if (data.comments && Array.isArray(data.comments)) {
        console.log(`[CommentsSection] Estableciendo ${data.comments.length} comentarios`)
        setComments(data.comments)
      } else {
        console.warn('Formato de respuesta inesperado:', data)
        setComments([])
      }
    } catch (error) {
      console.error('Error loading comments:', error)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al crear el comentario')
      }

      const commentText = newComment.trim()
      setNewComment('')
      
      // Trackear comentario (acción prioritaria)
      trackBehavior({
        postId,
        actionType: 'comment',
        metadata: { commentLength: commentText.length },
      })
      
      loadComments() // Recargar comentarios
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear el comentario')
    } finally {
      setSubmitting(false)
    }
  }

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const [vote, setVote] = useState<'up' | 'down' | null>(null)
    const voteCount = comment.upvotes - comment.downvotes
    const [timeAgo, setTimeAgo] = useState('hace unos segundos')
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [editContent, setEditContent] = useState(comment.content)
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Actualizar editContent cuando el comentario cambia
    useEffect(() => {
      setEditContent(comment.content)
    }, [comment.content])

    // Función para calcular tiempo transcurrido
    const calculateTimeAgo = (date: string | Date): string => {
      const now = new Date()
      const commentDate = new Date(date)
      const diff = now.getTime() - commentDate.getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      if (minutes < 1) return 'hace unos segundos'
      if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
      if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
      return `hace ${days} día${days > 1 ? 's' : ''}`
    }

    // Actualizar el tiempo dinámicamente
    useEffect(() => {
      if (!comment.created_at) return
      
      setTimeAgo(calculateTimeAgo(comment.created_at))
      
      // Para comentarios muy recientes (< 1 hora), actualizar cada 30 segundos
      // Para comentarios más antiguos, actualizar cada minuto
      const commentDate = new Date(comment.created_at)
      const now = new Date()
      const diff = now.getTime() - commentDate.getTime()
      const hours = diff / (1000 * 60 * 60)
      
      const intervalTime = hours < 1 ? 30000 : 60000 // 30 segundos si < 1 hora, 1 minuto si >= 1 hora
      
      const interval = setInterval(() => {
        setTimeAgo(calculateTimeAgo(comment.created_at))
      }, intervalTime)

      return () => clearInterval(interval)
    }, [comment.created_at])

    const handleEdit = async () => {
      if (!editContent.trim()) {
        alert('El contenido del comentario es requerido')
        return
      }

      setIsEditing(true)
      try {
        const res = await fetch(`/api/comments/${comment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editContent.trim() }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || 'Error al editar el comentario')
        }

        setShowEditModal(false)
        loadComments() // Recargar comentarios
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error al editar el comentario')
      } finally {
        setIsEditing(false)
      }
    }

    const handleDelete = async () => {
      setIsDeleting(true)
      try {
        const res = await fetch(`/api/comments/${comment.id}`, {
          method: 'DELETE',
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || 'Error al eliminar el comentario')
        }

        setShowDeleteModal(false)
        loadComments() // Recargar comentarios
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error al eliminar el comentario')
        setIsDeleting(false)
      }
    }

    return (
      <motion.div
        className={`${depth > 0 ? 'ml-8 mt-2' : ''} border-l-2 border-gray-200 pl-4`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex gap-3">
          {/* Vote buttons */}
          <div className="flex flex-col items-center pt-1 gap-1">
            <button
              onClick={() => setVote(vote === 'up' ? null : 'up')}
              className={`p-1.5 rounded-lg transition-all ${
                vote === 'up' 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
              title="Me gusta"
            >
              <ThumbsUp className={`w-3 h-3 ${vote === 'up' ? 'fill-current' : ''}`} />
            </button>
            <span className={`text-xs font-semibold py-0.5 ${
              vote === 'up' ? 'text-green-600' : vote === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {voteCount}
            </span>
            <button
              onClick={() => setVote(vote === 'down' ? null : 'down')}
              className={`p-1.5 rounded-lg transition-all ${
                vote === 'down' 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
              title="No me gusta"
            >
              <ThumbsDown className={`w-3 h-3 ${vote === 'down' ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-semibold text-gray-700">
                u/{comment.author_username}
              </span>
              <span className="text-xs text-gray-500">{timeAgo}</span>
              {comment.edited_at && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-xs text-gray-500 italic">
                    {t.post.edited} {new Date(comment.edited_at).toLocaleDateString()}
                  </span>
                </>
              )}
              {(comment.canEdit || comment.canDelete) && (
                <div className="flex items-center gap-2 ml-auto">
                  {comment.canEdit && (
                    <button
                      onClick={() => {
                        setEditContent(comment.content)
                        setShowEditModal(true)
                      }}
                      className="text-xs text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1"
                      title={t.post.edit}
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  )}
                  {comment.canDelete && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                      title={t.post.delete}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
            {depth < 3 && (
              <button className="text-xs text-gray-500 hover:text-gray-700">
                Responder
              </button>
            )}

            {/* Modal de edición de comentario */}
            {showEditModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">{t.post.edit}</h2>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-4"
                    rows={8}
                  />
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      disabled={isEditing}
                    >
                      {t.post.cancel}
                    </button>
                    <button
                      onClick={handleEdit}
                      disabled={isEditing || !editContent.trim()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEditing ? t.post.editing : t.post.save}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Modal de confirmación de eliminación de comentario */}
            {showDeleteModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{t.post.confirmDelete}</h2>
                  <p className="text-gray-600 mb-6">{t.post.confirmDeleteComment}</p>
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
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary-600" />
        <h2 className="text-lg font-bold text-gray-900">
          {t.post.comments} ({comments.length})
        </h2>
      </div>

      {/* Form para nuevo comentario - Solo visible si hay usuario logueado */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t.post.writeComment}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-2"
            required
          />
          <div className="flex justify-end">
            <motion.button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
            >
              <Send className="w-4 h-4" />
              {submitting ? t.post.commenting : t.post.comment}
            </motion.button>
          </div>
        </form>
      )}
      
      {/* Mensaje para usuarios no logueados */}
      {!user && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            {t.auth.signIn}
          </Link>
          {' '}{t.post.loginToComment}
        </div>
      )}

      {/* Lista de comentarios */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>{t.post.comments}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

