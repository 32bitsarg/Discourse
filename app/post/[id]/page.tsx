'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowUp, ArrowDown, MessageCircle, Share2, Bookmark, ArrowLeft } from 'lucide-react'
import ForumLayout from '@/components/ForumLayout'
import CommentsSection from '@/components/CommentsSection'
import PostContentRenderer from '@/components/PostContentRenderer'

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const [voteCount, setVoteCount] = useState(0)
  const [timeAgo, setTimeAgo] = useState('hace unos segundos')

  // Función para calcular tiempo transcurrido
  const calculateTimeAgo = (date: string | Date): string => {
    const now = new Date()
    const postDate = new Date(date)
    const diff = now.getTime() - postDate.getTime()
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
          console.error('Error:', data.message || 'Error al cargar el post')
          return
        }
        if (data.message) {
          console.error(data.message)
          return
        }
        if (data.id) {
          setPost(data)
          setVoteCount(data.upvotes - data.downvotes)
        } else {
          console.error('Post no encontrado en la respuesta')
        }
      })
      .catch(err => {
        console.error('Error loading post:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [postId])

  const handleVote = async (type: 'up' | 'down') => {
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
      
      // Recargar el post para obtener datos actualizados
      const postRes = await fetch(`/api/posts/${postId}`)
      const postData = await postRes.json()
      if (postData.id) {
        setPost(postData)
        setVoteCount(postData.upvotes - postData.downvotes)
        setVote(data.voteType)
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  if (loading) {
    return (
      <ForumLayout>
        <div className="bg-white rounded-lg border border-gray-200 p-12 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </ForumLayout>
    )
  }

  if (!post) {
    return (
      <ForumLayout>
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">Post no encontrado</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Volver al inicio
          </button>
        </div>
      </ForumLayout>
    )
  }

  return (
    <ForumLayout>
      <div className="space-y-4">
        {/* Botón volver */}
        <motion.button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver</span>
        </motion.button>

        {/* Post */}
        <motion.article
          className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex">
            {/* Vote Section */}
            <div className="flex flex-col items-center p-2 bg-gray-50">
              <motion.button
                onClick={() => handleVote('up')}
                className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                  vote === 'up' ? 'text-orange-500' : 'text-gray-500'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowUp className="w-5 h-5" />
              </motion.button>
              <span className={`text-sm font-bold py-1 ${
                vote === 'up' ? 'text-orange-500' : vote === 'down' ? 'text-blue-500' : 'text-gray-700'
              }`}>
                {voteCount}
              </span>
              <motion.button
                onClick={() => handleVote('down')}
                className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                  vote === 'down' ? 'text-blue-500' : 'text-gray-500'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ArrowDown className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Link
                  href={`/r/${post.subforum_slug}`}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  r/{post.subforum_name}
                </Link>
                <span className="text-gray-600">•</span>
                <span className="text-xs text-gray-500">Publicado por</span>
                <Link href={`/user/${post.author_username}`} className="text-xs font-semibold text-gray-700 hover:text-gray-900">
                  u/{post.author_username}
                </Link>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-500">{timeAgo}</span>
                {post.is_hot && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold">
                      🔥 Hot
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              {/* Content */}
              <div className="prose max-w-none mb-6">
                <PostContentRenderer content={post.content} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors text-sm">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comment_count} comentarios</span>
                </button>
                <button className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors text-sm">
                  <Share2 className="w-4 h-4" />
                  <span>Compartir</span>
                </button>
                <button className="flex items-center gap-1 text-gray-600 hover:text-yellow-600 transition-colors text-sm">
                  <Bookmark className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          </div>
        </motion.article>

        {/* Comments Section */}
        <CommentsSection postId={parseInt(postId)} />
      </div>
    </ForumLayout>
  )
}

