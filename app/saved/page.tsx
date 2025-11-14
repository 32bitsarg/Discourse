'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookmarkCheck, Loader2 } from 'lucide-react'
import PostCard from '@/components/PostCard'
import { useUser } from '@/lib/hooks/useUser'
import Link from 'next/link'

export default function SavedPostsPage() {
  const router = useRouter()
  const { user, isLoading: userLoading } = useUser()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/feed')
        return
      }
      loadSavedPosts()
    }
  }, [user, userLoading, router])

  const loadSavedPosts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/posts/saved')
      if (!res.ok) {
        throw new Error('Error al cargar posts guardados')
      }
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar posts guardados')
    } finally {
      setLoading(false)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            Posts Guardados
          </h1>
          <p className="text-gray-600">Tus posts favoritos guardados para más tarde</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {posts.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <BookmarkCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No tienes posts guardados</h2>
            <p className="text-gray-600 mb-4">Guarda posts que te interesen para encontrarlos fácilmente más tarde.</p>
            <Link
              href="/feed"
              className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Explorar Posts
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {posts.map((post: any) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PostCard
                id={post.id.toString()}
                title={post.title}
                content={post.content_preview || ''}
                author={post.author_username}
                forum={post.subforum_name}
                subforum={post.subforum_slug}
                postSlug={post.slug}
                upvotes={post.upvotes}
                comments={post.comment_count}
                createdAt={post.created_at}
                editedAt={post.edited_at}
                userVote={null}
                canEdit={false}
                canDelete={false}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

