'use client'

import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, MessageCircle, Share2, Bookmark } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import PostContentRenderer from './PostContentRenderer'

interface PostCardProps {
  id: string
  title: string
  content: string
  author: string
  forum: string
  subforum?: string
  upvotes: number
  comments: number
  createdAt: string | Date
  isHot?: boolean
  isNew?: boolean
  isFromMemberCommunity?: boolean
}

export default function PostCard({
  id,
  title,
  content,
  author,
  forum,
  subforum,
  upvotes,
  comments,
  createdAt,
  isHot = false,
  isNew = false,
  isFromMemberCommunity = false,
}: PostCardProps) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const [voteCount, setVoteCount] = useState(upvotes)
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
    setTimeAgo(calculateTimeAgo(createdAt))
    
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
  }, [createdAt])

  const handleVote = async (type: 'up' | 'down') => {
    try {
      const res = await fetch(`/api/posts/${id}/vote`, {
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
      
      if (data.voteType === null) {
        // Voto eliminado
        setVote(null)
        setVoteCount(upvotes)
      } else {
        // Voto actualizado o nuevo
        setVote(data.voteType)
        // Recargar el post para obtener el conteo actualizado
        fetch(`/api/posts/${id}`)
          .then(res => res.json())
          .then(postData => {
            if (postData.id) {
              setVoteCount(postData.upvotes - postData.downvotes)
            }
          })
          .catch(() => {})
      }
    } catch (error) {
      console.error('Error voting:', error)
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

        {/* Content Section */}
        <div className="flex-1 p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/r/${forum}`}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              r/{forum}
            </Link>
            <span className="text-gray-600">•</span>
            <span className="text-xs text-gray-500">Publicado por</span>
            <Link href={`/user/${author}`} className="text-xs font-semibold text-gray-700 hover:text-gray-900">
              u/{author}
            </Link>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-500">{timeAgo}</span>
            {(isHot || isNew) && (
              <>
                <span className="text-gray-600">•</span>
                {isHot && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold">
                    🔥 Hot
                  </span>
                )}
                {isNew && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">
                    ✨ Nuevo
                  </span>
                )}
              </>
            )}
          </div>

          {/* Title */}
          <Link href={`/post/${id}`} className="block mb-2">
            <h2 className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors cursor-pointer">
              {title}
            </h2>
          </Link>

              {/* Content Preview */}
              <div className="text-gray-600 text-sm mb-3 line-clamp-3">
                <PostContentRenderer content={content} />
              </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link
              href={`/post/${id}`}
              className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{comments} comentarios</span>
            </Link>
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
  )
}

