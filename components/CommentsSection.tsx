'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MessageCircle, Send, ThumbsUp, ThumbsDown, Edit, Trash2, X, Reply, Flag } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useSettings } from '@/lib/hooks/useSettings'
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking'
import { useComments } from '@/lib/hooks/useComments'
import { useUser } from '@/lib/hooks/useUser'
import SkeletonComment from './SkeletonComment'

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
  userVote?: 'up' | 'down' | null
  replies?: Comment[]
}

interface CommentsSectionProps {
  postId: number
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
  const { t } = useI18n()
  const { trackBehavior } = useBehaviorTracking()
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // OPTIMIZACIÓN: Usar SWR para caché automática
  const { comments, isLoading: loading, mutate } = useComments(postId)
  const { user } = useUser()

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
      
      mutate() // OPTIMIZACIÓN: Revalidar con SWR
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear el comentario')
    } finally {
      setSubmitting(false)
    }
  }

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const { settings } = useSettings()
    const [vote, setVote] = useState<'up' | 'down' | null>(comment.userVote || null)
    const [voteCount, setVoteCount] = useState(comment.upvotes - comment.downvotes)
    const [isVoting, setIsVoting] = useState(false)
    const [timeAgo, setTimeAgo] = useState('hace unos segundos')
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showReplyForm, setShowReplyForm] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [replyContent, setReplyContent] = useState('')
    const [reportReason, setReportReason] = useState('')
    const [reportDescription, setReportDescription] = useState('')
    const [isReplying, setIsReplying] = useState(false)
    const [isReporting, setIsReporting] = useState(false)
    const [editContent, setEditContent] = useState(comment.content)
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
      setEditContent(comment.content)
    }, [comment.content])

    // Actualizar voteCount y vote cuando cambie el comentario
    useEffect(() => {
      setVoteCount(comment.upvotes - comment.downvotes)
      setVote(comment.userVote || null)
    }, [comment.upvotes, comment.downvotes, comment.userVote])

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
        mutate() // OPTIMIZACIÓN: Revalidar con SWR
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
        mutate() // OPTIMIZACIÓN: Revalidar con SWR
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Error al eliminar el comentario')
        setIsDeleting(false)
      }
    }

    return (
      <motion.div
        className={`${depth > 0 ? 'ml-4 sm:ml-8 mt-1 sm:mt-2' : ''} border-l-2 border-gray-200 pl-2 sm:pl-4`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex gap-1.5 sm:gap-3">
          {/* Vote buttons */}
          <div className="flex flex-col items-center pt-0.5 sm:pt-1 gap-0.5 sm:gap-1">
            <button
              onClick={async () => {
                if (isVoting) return
                const newVote = vote === 'up' ? null : 'up'
                setIsVoting(true)
                try {
                  const res = await fetch(`/api/comments/${comment.id}/vote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ voteType: newVote || 'up' }),
                  })
                  if (res.ok) {
                    const data = await res.json()
                    setVote(data.voteType)
                    // OPTIMIZACIÓN: Revalidar usando SWR mutate en lugar de loadComments
                    mutate()
                  } else {
                    const error = await res.json()
                    alert(error.message || 'Error al votar')
                  }
                } catch (error) {
                  alert('Error al votar')
                } finally {
                  setIsVoting(false)
                }
              }}
              disabled={isVoting}
              className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                vote === 'up' 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'text-gray-400 hover:bg-gray-100'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Me gusta"
            >
              <ThumbsUp className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${vote === 'up' ? 'fill-current' : ''}`} />
            </button>
            {settings.showVoteCounts && (
              <span className={`text-[10px] sm:text-xs font-semibold py-0.5 leading-tight ${
                vote === 'up' ? 'text-green-600' : vote === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {voteCount}
              </span>
            )}
            {settings.allowDownvotes && (
              <button
                onClick={async () => {
                  if (isVoting) return
                  const newVote = vote === 'down' ? null : 'down'
                  setIsVoting(true)
                  try {
                    const res = await fetch(`/api/comments/${comment.id}/vote`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ voteType: newVote || 'down' }),
                    })
                    if (res.ok) {
                    const data = await res.json()
                    setVote(data.voteType)
                    // OPTIMIZACIÓN: Revalidar usando SWR mutate en lugar de loadComments
                    mutate()
                  } else {
                      const error = await res.json()
                      alert(error.message || 'Error al votar')
                    }
                  } catch (error) {
                    alert('Error al votar')
                  } finally {
                    setIsVoting(false)
                  }
                }}
                disabled={isVoting}
                className={`p-1 sm:p-1.5 rounded-lg transition-all ${
                  vote === 'down' 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'text-gray-400 hover:bg-gray-100'
                } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="No me gusta"
              >
                <ThumbsDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${vote === 'down' ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
              <span className="text-[10px] sm:text-xs font-semibold text-gray-700 truncate">
                u/{comment.author_username}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500">{timeAgo}</span>
              {comment.edited_at && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 italic">
                    {t.post.edited} {new Date(comment.edited_at).toLocaleDateString()}
                  </span>
                </>
              )}
              {(comment.canEdit || comment.canDelete) && (
                <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                  {comment.canEdit && (
                    <button
                      onClick={() => {
                        setEditContent(comment.content)
                        setShowEditModal(true)
                      }}
                      className="text-[10px] sm:text-xs text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-0.5 sm:gap-1"
                      title={t.post.edit}
                    >
                      <Edit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  )}
                  {comment.canDelete && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="text-[10px] sm:text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-0.5 sm:gap-1"
                      title={t.post.delete}
                    >
                      <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2 break-words">{comment.content}</p>
            
            {/* Acciones: Responder y Reportar */}
            <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
              {depth < 5 && user && (
                <button
                  onClick={() => {
                    setShowReplyForm(!showReplyForm)
                    setReplyContent('')
                  }}
                  className="text-[10px] sm:text-xs text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1"
                >
                  <Reply className="w-3 h-3" />
                  Responder
                </button>
              )}
              {user && comment.author_id !== user.id && (
                <button
                  onClick={() => {
                    setShowReportModal(true)
                    setReportReason('')
                    setReportDescription('')
                  }}
                  className="text-[10px] sm:text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <Flag className="w-3 h-3" />
                  Reportar
                </button>
              )}
            </div>

            {/* Formulario de respuesta */}
            {showReplyForm && user && (
              <div className="mt-2 sm:mt-3 pl-2 sm:pl-4 border-l-2 border-gray-200">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Responder a u/${comment.author_username}...`}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-2"
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (!replyContent.trim() || isReplying) return
                      setIsReplying(true)
                      try {
                        const res = await fetch(`/api/posts/${postId}/comments`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            content: replyContent.trim(),
                            parentId: comment.id,
                          }),
                        })

                        if (!res.ok) {
                          const error = await res.json()
                          throw new Error(error.message || 'Error al responder')
                        }

                        setReplyContent('')
                        setShowReplyForm(false)
                        mutate() // OPTIMIZACIÓN: Revalidar usando SWR mutate
                      } catch (error) {
                        alert(error instanceof Error ? error.message : 'Error al responder')
                      } finally {
                        setIsReplying(false)
                      }
                    }}
                    disabled={!replyContent.trim() || isReplying}
                    className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    {isReplying ? 'Enviando...' : 'Responder'}
                  </button>
                  <button
                    onClick={() => {
                      setShowReplyForm(false)
                      setReplyContent('')
                    }}
                    className="px-3 py-1.5 text-gray-600 text-xs rounded-lg hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Modal de reporte */}
            {showReportModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Reportar Comentario</h2>
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
                              commentId: comment.id,
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
                </motion.div>
              </div>
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
          <div className={`mt-1 sm:mt-2 space-y-1 sm:space-y-2 ${depth < 4 ? 'pl-2 sm:pl-4 border-l-2 border-gray-200' : ''}`}>
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
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-2 sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
        <h2 className="text-sm sm:text-lg font-bold text-gray-900">
          {t.post.comments} ({comments.length})
        </h2>
      </div>

      {/* Form para nuevo comentario - Solo visible si hay usuario logueado */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-3 sm:mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t.post.writeComment}
            rows={3}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none mb-2"
            required
          />
          <div className="flex justify-end">
            <motion.button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {submitting ? t.post.commenting : t.post.comment}
            </motion.button>
          </div>
        </form>
      )}
      
      {/* Mensaje para usuarios no logueados */}
      {!user && (
        <div className="mb-3 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg text-center text-xs sm:text-sm text-gray-600">
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            {t.auth.signIn}
          </Link>
          {' '}{t.post.loginToComment}
        </div>
      )}

      {/* Lista de comentarios */}
      {loading ? (
        <div className="space-y-2 sm:space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonComment key={i} />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 sm:py-8 text-gray-500">
          <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-xs sm:text-base">{t.post.comments}</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-4">
          {comments.map((comment: any) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </motion.div>
  )
}

