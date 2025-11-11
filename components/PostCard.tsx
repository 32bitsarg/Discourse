'use client'

import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, MessageCircle, Share2, Bookmark } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import PostContentRenderer from './PostContentRenderer'
import { useI18n } from '@/lib/i18n/context'
import { useBehaviorTracking, useViewTracking } from '@/hooks/useBehaviorTracking'

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
  const { t } = useI18n()
  const { trackBehavior } = useBehaviorTracking()
  const postIdNum = parseInt(id)
  const startTimeRef = useRef<number | null>(null)
  
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const [voteCount, setVoteCount] = useState(upvotes)
  const [timeAgo, setTimeAgo] = useState(t.common.seconds)

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
        <div className="flex flex-col items-center p-1.5 sm:p-2 bg-gray-50">
          <motion.button
            onClick={() => handleVote('up')}
            className={`p-0.5 sm:p-1 rounded hover:bg-gray-200 transition-colors ${
              vote === 'up' ? 'text-orange-500' : 'text-gray-500'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
          <span className={`text-xs sm:text-sm font-bold py-0.5 sm:py-1 ${
            vote === 'up' ? 'text-orange-500' : vote === 'down' ? 'text-blue-500' : 'text-gray-700'
          }`}>
            {voteCount}
          </span>
          <motion.button
            onClick={() => handleVote('down')}
            className={`p-0.5 sm:p-1 rounded hover:bg-gray-200 transition-colors ${
              vote === 'down' ? 'text-blue-500' : 'text-gray-500'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3 sm:p-4 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
            <Link
              href={`/r/${forum}`}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 truncate"
            >
              r/{forum}
            </Link>
            <span className="text-gray-600 hidden sm:inline">•</span>
            <span className="text-xs text-gray-500 hidden sm:inline">{t.post.postedBy}</span>
            <Link href={`/user/${author}`} className="text-xs font-semibold text-gray-700 hover:text-gray-900 truncate">
              <span className="hidden sm:inline">u/</span>{author}
            </Link>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo}</span>
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
            href={`/post/${id}`}
            onClick={() => {
              if (!isNaN(postIdNum)) {
                trackBehavior({
                  postId: postIdNum,
                  actionType: 'click',
                  metadata: { target: 'title' },
                })
              }
            }}
            className="block mb-2"
          >
            <h2 className="text-base sm:text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors cursor-pointer line-clamp-2">
              {title}
            </h2>
          </Link>

              {/* Content Preview */}
              <div className="text-gray-600 text-sm mb-3 line-clamp-3">
                <PostContentRenderer content={content} />
              </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <Link
              href={`/post/${id}`}
              onClick={() => {
                if (!isNaN(postIdNum)) {
                  trackBehavior({
                    postId: postIdNum,
                    actionType: 'click',
                    metadata: { target: 'comments' },
                  })
                }
              }}
              className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors text-xs sm:text-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{comments} {t.post.comments}</span>
              <span className="sm:hidden">{comments}</span>
            </Link>
            <button 
              onClick={() => {
                if (!isNaN(postIdNum)) {
                  trackBehavior({
                    postId: postIdNum,
                    actionType: 'share',
                  })
                }
              }}
              className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors text-xs sm:text-sm"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t.post.share}</span>
            </button>
            <button 
              onClick={() => {
                if (!isNaN(postIdNum)) {
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
  )
}

