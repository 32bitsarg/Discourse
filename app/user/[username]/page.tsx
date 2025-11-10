'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Calendar, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react'
import ForumLayout from '@/components/ForumLayout'

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ username: string; id: number } | null>(null)

  useEffect(() => {
    // Verificar usuario actual
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user)
        }
      })
      .catch(() => {})

    // Cargar perfil del usuario
    if (username) {
      setLoading(true)
      fetch(`/api/user/${username}`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user)
            setPosts(data.posts || [])
          }
        })
        .catch(err => {
          console.error('Error loading user:', err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [username])

  if (loading) {
    return (
      <ForumLayout>
        <div className="bg-white rounded-lg border border-gray-200 p-12 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </ForumLayout>
    )
  }

  if (!user) {
    return (
      <ForumLayout>
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">Usuario no encontrado</p>
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

  const isOwnProfile = currentUser?.username === username

  return (
    <ForumLayout>
      <div className="space-y-4">
        {/* Botón volver */}
        <Link href="/">
          <motion.div
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            whileHover={{ x: -4 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </motion.div>
        </Link>

        {/* Header del perfil */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                u/{user.username}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                {user.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Miembro desde {new Date(user.created_at).getFullYear()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{posts.length} publicaciones</span>
                </div>
              </div>
              {user.karma !== undefined && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-600">Karma:</span>
                  <span className="text-lg font-bold text-primary-600">{user.karma}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Posts del usuario */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Publicaciones</h2>
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">
                {isOwnProfile ? 'Aún no has publicado nada' : 'Este usuario aún no ha publicado nada'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <motion.article
                  key={post.id}
                  className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm transition-colors overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                      <Link
                        href={`/r/${post.subforum_slug}`}
                        className="text-primary-600 hover:text-primary-700 font-semibold"
                      >
                        r/{post.subforum_name}
                      </Link>
                      <span>•</span>
                      <span>{post.timeAgo}</span>
                    </div>
                    <Link href={`/post/${post.id}`}>
                      <h3 className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors mb-2 cursor-pointer">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <ArrowUp className="w-4 h-4" />
                        <span>{post.upvotes - post.downvotes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comment_count} comentarios</span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </div>
    </ForumLayout>
  )
}

