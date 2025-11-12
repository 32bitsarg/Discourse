'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Bookmark, ArrowLeft, Edit, Trash2, X } from 'lucide-react'
import CommentsSection from '@/components/CommentsSection'
import PostContentRenderer from '@/components/PostContentRenderer'
import RichTextEditor from '@/components/RichTextEditor'
import { useI18n } from '@/lib/i18n/context'
import { useViewTracking, useBehaviorTracking } from '@/hooks/useBehaviorTracking'
import SharePostButton from '@/components/SharePostButton'
import AdminBadge from '@/components/AdminBadge'

export default function PostPage() {
  const { t } = useI18n()
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const [voteCount, setVoteCount] = useState(0)
  const [timeAgo, setTimeAgo] = useState(t.common.seconds)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  
  const postIdNum = postId ? parseInt(postId) : undefined
  const { trackBehavior } = useBehaviorTracking()
  
  // Trackear visualización del post completo
  useViewTracking(postIdNum)

  // Función para calcular tiempo transcurrido
  const calculateTimeAgo = (date: string | Date): string => {
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
  }

  // Actualizar el tiempo dinámicamente
  useEffect(() => {
    if (!post?.created_at) return
    
    setTimeAgo(calculateTimeAgo(post.created_at))
    
    // Para posts muy recientes (< 1 hora), actualizar cada 30 segundos
    // Para posts más antiguos, actualizar cada minuto
    const postDate = new Date(post.created_at)
    const now = new Date()
    const diff = now.getTime() - postDate.getTime()
    const hours = diff / (1000 * 60 * 60)
    
    const intervalTime = hours < 1 ? 30000 : 60000 // 30 segundos si < 1 hora, 1 minuto si >= 1 hora
    
    const interval = setInterval(() => {
      setTimeAgo(calculateTimeAgo(post.created_at))
    }, intervalTime)

    return () => clearInterval(interval)
  }, [post?.created_at])

  useEffect(() => {
    if (!postId) return

    setLoading(true)
    fetch(`/api/posts/${postId}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) {
          return
        }
        if (data.message) {
          return
        }
        if (data.id) {
          setPost(data)
          setVoteCount(data.upvotes - data.downvotes)
          setVote(data.userVote || null) // Cargar el voto del usuario
          setEditTitle(data.title)
          setEditContent(data.content)
        } else {
        }
      })
      .catch(err => {
      })
      .finally(() => {
        setLoading(false)
      })
  }, [postId])

  const handleEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert(t.post.title + ' y ' + t.post.content + ' son requeridos')
      return
    }

    setIsEditing(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), content: editContent.trim() }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al editar el post')
      }

      setShowEditModal(false)
      // Recargar el post
      const res2 = await fetch(`/api/posts/${postId}`)
      const data = await res2.json()
      if (data.id) {
        setPost(data)
        setEditTitle(data.title)
        setEditContent(data.content)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al editar el post')
    } finally {
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al eliminar el post')
      }

      // Redirigir al feed
      router.push('/feed')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar el post')
      setIsDeleting(false)
    }
  }

  const handleVote = async (type: 'up' | 'down') => {
    // Trackear voto
    if (postIdNum) {
      trackBehavior({
        postId: postIdNum,
        actionType: 'vote',
        metadata: { voteType: type },
      })
    }
    
    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType: type }),
      })

      if (!res.ok) {
        const error = await res.json()
        if (error.message?.includes('sesión')) {
          alert('Debes iniciar sesión para votar')
          return
        }
        throw new Error(error.message || 'Error al votar')
      }

      const data = await res.json()
      
      // Actualizar el estado del voto inmediatamente
      setVote(data.voteType)
      
      // Recargar el post para obtener datos actualizados
      const postRes = await fetch(`/api/posts/${postId}`)
      const postData = await postRes.json()
      if (postData.id) {
        setPost(postData)
        setVoteCount(postData.upvotes - postData.downvotes)
        // Asegurar que el voto se mantenga sincronizado
        setVote(postData.userVote || data.voteType)
      }
    } catch (error) {
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-lg">{t.common.error}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          {t.community.backToHome}
        </button>
      </div>
    )
  }

  return (
      <div className="space-y-4">
        {/* Botón volver */}
        <motion.button
          onClick={() => router.push('/feed')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t.post.back}</span>
        </motion.button>

        {/* Post */}
        <motion.article
          className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex">
            {/* Vote Section */}
            <div className="flex flex-col items-center p-1.5 sm:p-2 bg-gray-50 rounded-l-lg">
              <motion.button
                onClick={() => handleVote('up')}
                className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                  vote === 'up' 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Me gusta"
              >
                <ThumbsUp className={`w-4 h-4 sm:w-5 sm:h-5 ${vote === 'up' ? 'fill-current' : ''}`} />
              </motion.button>
              <span className={`text-xs sm:text-sm font-bold py-1 sm:py-1.5 ${
                vote === 'up' ? 'text-green-600' : vote === 'down' ? 'text-red-600' : 'text-gray-700'
              }`}>
                {voteCount}
              </span>
              <motion.button
                onClick={() => handleVote('down')}
                className={`p-1.5 sm:p-2 rounded-lg transition-all ${
                  vote === 'down' 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="No me gusta"
              >
                <ThumbsDown className={`w-4 h-4 sm:w-5 sm:h-5 ${vote === 'down' ? 'fill-current' : ''}`} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 sm:p-6 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
                <Link
                  href={`/r/${post.subforum_slug}`}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 truncate"
                >
                  r/{post.subforum_name}
                </Link>
                <span className="text-gray-600 hidden sm:inline">•</span>
                <span className="text-xs text-gray-500 hidden sm:inline">{t.post.postedBy}</span>
                <Link href={`/user/${post.author_username}`} className="text-xs font-semibold text-gray-700 hover:text-gray-900 truncate flex items-center gap-1">
                  <span className="hidden sm:inline">u/</span>
                  <span>{post.author_username}</span>
                  <AdminBadge username={post.author_username} />
                </Link>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo}</span>
                {post.edited_at && (
                  <>
                    <span className="text-gray-600 hidden sm:inline">•</span>
                    <span className="text-xs text-gray-500 italic">
                      {t.post.edited} {new Date(post.edited_at).toLocaleDateString()}
                    </span>
                  </>
                )}
                {post.is_hot && (
                  <>
                    <span className="text-gray-600 hidden sm:inline">•</span>
                    <span className="text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold whitespace-nowrap">
                      🔥 {t.post.hot}
                    </span>
                  </>
                )}
                {post.canEdit && (
                  <>
                    <span className="text-gray-600 hidden sm:inline">•</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="text-xs text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1"
                        title={t.post.edit}
                      >
                        <Edit className="w-3 h-3" />
                        <span className="hidden sm:inline">{t.post.edit}</span>
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                        title={t.post.delete}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">{t.post.delete}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                {post.title}
              </h1>

              {/* Content */}
              <div className="prose prose-sm sm:prose-base max-w-none mb-4 sm:mb-6">
                <PostContentRenderer content={post.content} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200 flex-wrap">
                <button className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors text-xs sm:text-sm">
                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{post.comment_count} {t.post.comments}</span>
                  <span className="sm:hidden">{post.comment_count}</span>
                </button>
                <SharePostButton
                  postId={postIdNum || 0}
                  postTitle={post?.title || ''}
                  postUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/post/${postId}`}
                  onShareComplete={() => {
                    if (postIdNum) {
                      trackBehavior({
                        postId: postIdNum,
                        actionType: 'share',
                        metadata: { source: 'postpage' },
                      })
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (postIdNum) {
                      trackBehavior({
                        postId: postIdNum,
                        actionType: 'save',
                      })
                    }
                  }}
                  className="flex items-center gap-1 text-gray-600 hover:text-yellow-600 transition-colors text-xs sm:text-sm"
                >
                  <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t.post.save}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.article>

        {/* Comments Section */}
        <CommentsSection postId={parseInt(postId)} />

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
                    {/* Vista previa de imágenes */}
                    {(() => {
                      const imageMatches = editContent.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []
                      const images: Array<{ alt: string; src: string }> = []
                      
                      imageMatches.forEach(match => {
                        const imgMatch = match.match(/!\[([^\]]*)\]\(([^)]+)\)/)
                        if (imgMatch) {
                          const [, alt, src] = imgMatch
                          const cleanSrc = src.replace(/\s+/g, '').trim()
                          if (cleanSrc.startsWith('data:image/') || (cleanSrc && !cleanSrc.startsWith('<') && !cleanSrc.startsWith('data:'))) {
                            images.push({ alt: alt || 'Imagen', src: cleanSrc })
                          }
                        }
                      })
                      
                      if (images.length === 0) return null
                      
                      return (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Vista previa de imágenes:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {images.map((img, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={img.src}
                                  alt={img.alt}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })()}
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
      </div>
  )
}

