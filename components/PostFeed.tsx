'use client'

import { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import PostCard from './PostCard'
import SkeletonPostCard from './SkeletonPostCard'
import { useI18n } from '@/lib/i18n/context'
import { usePosts, useForYouFeed, useFollowingFeed } from '@/lib/hooks/usePosts'

interface PostFeedProps {
  filter?: string
  subforumId?: number
}

export interface PostFeedRef {
  refresh: () => void
  removePost: (postId: string) => void
}

const PostFeed = forwardRef<PostFeedRef, PostFeedProps>(({ filter = 'all', subforumId }, ref) => {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [allPosts, setAllPosts] = useState<any[]>([])
  const observerTarget = useRef<HTMLDivElement>(null)
  
  // OPTIMIZACIÓN: Usar SWR para caché automática y revalidación
  const { posts: postsData, isLoading, mutate } = usePosts({ filter, subforumId, page, limit: 10 })
  const { posts: forYouPosts, isLoading: forYouLoading, mutate: mutateForYou } = useForYouFeed(page, 10)
  const { posts: followingPosts, isLoading: followingLoading, mutate: mutateFollowing } = useFollowingFeed(page, 10)
  
  // Determinar qué datos usar según el filtro
  const currentPosts = filter === 'for-you' ? forYouPosts : filter === 'following' ? followingPosts : postsData
  const loading = filter === 'for-you' ? forYouLoading : filter === 'following' ? followingLoading : isLoading
  const mutateFn = filter === 'for-you' ? mutateForYou : filter === 'following' ? mutateFollowing : mutate
  
  // Acumular posts para infinite scroll
  useEffect(() => {
    if (currentPosts && currentPosts.length > 0) {
      if (page === 1) {
        setAllPosts(currentPosts)
      } else {
        setAllPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const newPosts = currentPosts.filter((p: any) => !existingIds.has(p.id))
          return [...prev, ...newPosts]
        })
      }
    } else if (page === 1) {
      setAllPosts([])
    }
  }, [currentPosts, page])

  // Reset cuando cambia el filtro o subforumId
  useEffect(() => {
    setPage(1)
    setAllPosts([])
  }, [filter, subforumId])

  const removePost = useCallback((postId: string) => {
    setAllPosts(prev => prev.filter(p => p.id.toString() !== postId))
  }, [])

  const loadMore = useCallback(() => {
    if (loading || !currentPosts || currentPosts.length === 0) {
      return
    }
    setPage(prev => prev + 1)
  }, [loading, currentPosts])

  // Exponer método refresh
  useImperativeHandle(ref, () => ({
    refresh: () => {
      setPage(1)
      setAllPosts([])
      mutateFn()
    },
    removePost: removePost
  }), [mutateFn, removePost])

  // Infinite scroll con Intersection Observer
  useEffect(() => {
    const currentTarget = observerTarget.current
    if (!currentTarget || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && currentPosts && currentPosts.length > 0) {
          loadMore()
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px'
      }
    )

    observer.observe(currentTarget)

    return () => {
      observer.disconnect()
    }
  }, [loading, currentPosts, loadMore])

  // OPTIMIZACIÓN: Polling reducido - solo cuando la página está visible y cada 2 minutos
  useEffect(() => {
    if (filter === 'for-you' || filter === 'following') {
      // No hacer polling para feeds personalizados - SWR maneja la revalidación
      return
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Revalidar cuando la página vuelve a ser visible
        mutateFn()
      }
    }

    // Polling optimizado: solo cada 2 minutos cuando está visible
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        mutateFn()
      }
    }, 120000) // 2 minutos en lugar de 30 segundos

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [filter, mutateFn])

  if (loading && allPosts.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonPostCard key={i} />
        ))}
      </div>
    )
  }

  if (allPosts.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-lg">No hay posts aún. ¡Sé el primero en crear uno!</p>
      </div>
    )
  }

  const hasMore = currentPosts && currentPosts.length === 10

  return (
    <div className="space-y-2 sm:space-y-4">
      {allPosts.map((post, index) => (
        <PostCard
          key={`post-${post.id}-${index}`}
          id={post.id.toString()}
          title={post.title}
          content={post.content || post.content_preview || ''}
          author={post.author_username}
          forum={post.subforum_slug}
          subforum={post.subforum_slug}
          postSlug={post.slug}
          upvotes={post.upvotes - post.downvotes}
          comments={post.comment_count}
          createdAt={post.created_at}
          isHot={post.is_hot}
          isNew={post.isNew}
          isFromMemberCommunity={post.isFromMemberCommunity || false}
          userVote={post.userVote || null}
          canEdit={post.canEdit || false}
          canDelete={post.canDelete || false}
          editedAt={post.edited_at || null}
          onDelete={removePost}
        />
      ))}
      
      {/* Elemento observador para infinite scroll */}
      {hasMore && (
        <div 
          ref={observerTarget} 
          className="py-8 min-h-[100px] flex items-center justify-center"
        >
          {loading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando más posts...</p>
            </div>
          ) : (
            <div className="text-center opacity-0 pointer-events-none h-1 w-full"></div>
          )}
        </div>
      )}
      
      {!hasMore && allPosts.length > 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-gray-500 text-lg font-medium">{t.post.noMorePosts || 'No hay más posts'}</p>
        </div>
      )}
    </div>
  )
})

PostFeed.displayName = 'PostFeed'

export default PostFeed
