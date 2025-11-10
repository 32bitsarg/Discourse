'use client'

import { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import PostCard from './PostCard'

interface PostFeedProps {
  filter?: string
  subforumId?: number
}

export interface PostFeedRef {
  refresh: () => void
}

const PostFeed = forwardRef<PostFeedRef, PostFeedProps>(({ filter = 'all', subforumId }, ref) => {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const observerTarget = useRef<HTMLDivElement>(null)

  const loadPosts = useCallback(async (showLoading = false, pageNum = 1, append = false) => {
    if (showLoading && !append) {
      setLoading(true)
    }
    if (append) {
      setLoadingMore(true)
    }
    
    const url = subforumId 
      ? `/api/posts?filter=${filter}&subforum_id=${subforumId}&page=${pageNum}&limit=10`
      : `/api/posts?filter=${filter}&page=${pageNum}&limit=10`
    
    console.log('[PostFeed] loadPosts:', { url, pageNum, append })
    
    try {
      const res = await fetch(url)
      const data = await res.json()
      
      console.log('[PostFeed] Respuesta recibida:', {
        postsCount: data.posts?.length || 0,
        hasMore: data.pagination?.hasMore,
        page: data.pagination?.page
      })
      
      if (data.posts) {
        if (append) {
          // Agregar nuevos posts a los existentes, filtrando duplicados
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const newPosts = data.posts.filter((p: any) => !existingIds.has(p.id))
            const combined = [...prev, ...newPosts]
            console.log('[PostFeed] Posts totales después de append:', combined.length, `(${newPosts.length} nuevos)`)
            return combined
          })
        } else {
          // Reemplazar posts (primera carga o refresh)
          setPosts(data.posts || [])
          console.log('[PostFeed] Posts reemplazados:', data.posts?.length || 0)
        }
        const newHasMore = data.pagination?.hasMore || false
        setHasMore(newHasMore)
        setPage(pageNum)
        lastUpdateRef.current = Date.now()
        console.log('[PostFeed] hasMore actualizado a:', newHasMore)
      }
    } catch (error) {
      console.error('[PostFeed] Error loading posts:', error)
    } finally {
      if (showLoading && !append) {
        setLoading(false)
      }
      if (append) {
        setLoadingMore(false)
      }
    }
  }, [filter, subforumId])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) {
      console.log('[PostFeed] loadMore bloqueado:', { loadingMore, hasMore })
      return
    }
    
    console.log('[PostFeed] Cargando más posts...')
    setPage(currentPage => {
      const nextPage = currentPage + 1
      console.log('[PostFeed] Cargando página:', nextPage)
      loadPosts(false, nextPage, true)
      return nextPage
    })
  }, [loadingMore, hasMore, loadPosts])

  // Exponer método refresh para que el componente padre pueda actualizar el feed
  useImperativeHandle(ref, () => ({
    refresh: () => {
      setPage(1)
      setHasMore(true)
      loadPosts(false, 1, false)
    }
  }))

  // Intersection Observer para detectar cuando el usuario llega al final
  useEffect(() => {
    if (!hasMore) {
      console.log('[PostFeed] No hay más posts, no configurando observer')
      return
    }

    let observer: IntersectionObserver | null = null

    // Esperar un tick para asegurar que el DOM esté actualizado
    const timeoutId = setTimeout(() => {
      const currentTarget = observerTarget.current
      if (!currentTarget) {
        console.log('[PostFeed] observerTarget no disponible aún')
        return
      }

      console.log('[PostFeed] Configurando IntersectionObserver')
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          console.log('[PostFeed] IntersectionObserver callback:', {
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            hasMore,
            loadingMore
          })
          
          if (entry.isIntersecting && hasMore && !loadingMore) {
            console.log('[PostFeed] Activando loadMore desde observer')
            loadMore()
          }
        },
        { 
          threshold: 0.01, // Disparar con solo 1% visible
          rootMargin: '300px' // Cargar 300px antes de llegar al final
        }
      )

      observer.observe(currentTarget)
      console.log('[PostFeed] Observer configurado y observando elemento')
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      if (observer) {
        console.log('[PostFeed] Limpiando observer')
        observer.disconnect()
      }
    }
  }, [hasMore, loadingMore, loadMore, posts.length])

  useEffect(() => {
    // Cargar posts inicialmente (primera página)
    setPage(1)
    setHasMore(true)
    loadPosts(true, 1, false)

    // Configurar actualización automática solo si la página está visible
    // Solo actualizar la primera página para no duplicar posts
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Cuando la página se vuelve visible, actualizar solo la primera página
        setPage(1)
        setHasMore(true)
        loadPosts(false, 1, false)
        // Reiniciar intervalo
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        // Actualizar cada 30 segundos si la página está visible
        intervalRef.current = setInterval(() => {
          // Solo actualizar si han pasado al menos 20 segundos desde la última actualización
          if (Date.now() - lastUpdateRef.current > 20000) {
            setPage(1)
            setHasMore(true)
            loadPosts(false, 1, false)
          }
        }, 30000) // Cada 30 segundos
      } else {
        // Si la página no está visible, pausar actualizaciones
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }

    // Iniciar actualizaciones automáticas solo si la página está visible
    if (document.visibilityState === 'visible') {
      intervalRef.current = setInterval(() => {
        if (Date.now() - lastUpdateRef.current > 20000) {
          setPage(1)
          setHasMore(true)
          loadPosts(false, 1, false)
        }
      }, 30000) // Cada 30 segundos
    }

    // Escuchar cambios de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Limpiar al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [filter, subforumId])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-lg">No hay posts aún. ¡Sé el primero en crear uno!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <PostCard
          key={`post-${post.id}-${index}`}
          id={post.id.toString()}
          title={post.title}
          content={post.content}
          author={post.author_username}
          forum={post.subforum_slug}
          subforum={post.subforum_name}
          upvotes={post.upvotes - post.downvotes}
          comments={post.comment_count}
          createdAt={post.created_at}
          isHot={post.is_hot}
          isNew={post.isNew}
          isFromMemberCommunity={post.isFromMemberCommunity || false}
        />
      ))}
      
      {/* Elemento observador para infinite scroll */}
      {hasMore && (
        <div 
          ref={observerTarget} 
          className="py-8 min-h-[100px] flex items-center justify-center"
          style={{ minHeight: '100px' }}
        >
          {loadingMore ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando más posts...</p>
            </div>
          ) : (
            <div className="text-center opacity-0 pointer-events-none">
              {/* Elemento invisible para trigger del observer */}
              <div className="h-1 w-full"></div>
            </div>
          )}
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-gray-500 text-lg font-medium">No hay más publicaciones</p>
        </div>
      )}
    </div>
  )
})

PostFeed.displayName = 'PostFeed'

export default PostFeed

