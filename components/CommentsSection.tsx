'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { MessageCircle, Send, ArrowUp, ArrowDown } from 'lucide-react'

interface Comment {
  id: number
  content: string
  author_username: string
  upvotes: number
  downvotes: number
  created_at: string
  replies?: Comment[]
}

interface CommentsSectionProps {
  postId: number
}

export default function CommentsSection({ postId }: CommentsSectionProps) {
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

      setNewComment('')
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

    return (
      <motion.div
        className={`${depth > 0 ? 'ml-8 mt-2' : ''} border-l-2 border-gray-200 pl-4`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex gap-3">
          {/* Vote buttons */}
          <div className="flex flex-col items-center pt-1">
            <button
              onClick={() => setVote(vote === 'up' ? null : 'up')}
              className={`p-1 rounded hover:bg-gray-100 ${vote === 'up' ? 'text-orange-500' : 'text-gray-400'}`}
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <span className="text-xs font-semibold text-gray-600 py-0.5">{voteCount}</span>
            <button
              onClick={() => setVote(vote === 'down' ? null : 'down')}
              className={`p-1 rounded hover:bg-gray-100 ${vote === 'down' ? 'text-blue-500' : 'text-gray-400'}`}
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-700">
                u/{comment.author_username}
              </span>
              <span className="text-xs text-gray-500">{timeAgo}</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
            {depth < 3 && (
              <button className="text-xs text-gray-500 hover:text-gray-700">
                Responder
              </button>
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
          Comentarios ({comments.length})
        </h2>
      </div>

      {/* Form para nuevo comentario - Solo visible si hay usuario logueado */}
      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
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
              {submitting ? 'Publicando...' : 'Comentar'}
            </motion.button>
          </div>
        </form>
      )}
      
      {/* Mensaje para usuarios no logueados */}
      {!user && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
          <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            Inicia sesión
          </Link>
          {' '}para comentar
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
          <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
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

