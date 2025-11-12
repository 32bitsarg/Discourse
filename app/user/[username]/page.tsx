'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Calendar, MessageSquare, MapPin, Globe, Github, Twitter, Linkedin, ExternalLink, Edit } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import FollowButton from '@/components/FollowButton'
import EditProfileModal from '@/components/EditProfileModal'
import AdminBadge from '@/components/AdminBadge'
import PostContentRenderer from '@/components/PostContentRenderer'

const socialIcons: Record<string, any> = {
  twitter: Twitter,
  github: Github,
  linkedin: Linkedin,
  website: Globe,
}

export default function UserProfilePage() {
  const { t } = useI18n()
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ username: string; id: number } | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

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
      loadProfile()
    }
  }, [username])

  const loadProfile = () => {
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-lg">{t.user.notFound}</p>
        <button
          onClick={() => router.push('/feed')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          {t.community.backToHome}
        </button>
      </div>
    )
  }

  const isOwnProfile = currentUser?.username === username
  const themeColor = user.theme_color || '#6366f1'

  return (
    <div className="space-y-4">
      {/* Botón volver */}
      <Link href="/feed">
        <motion.div
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t.post.back}</span>
        </motion.div>
      </Link>

      {/* Banner y Header del perfil */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Banner */}
        <div 
          className="h-48 w-full relative"
          style={{ 
            backgroundColor: themeColor,
            backgroundImage: user.banner_url ? `url(${user.banner_url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {!user.banner_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-500 opacity-80"></div>
          )}
        </div>

        {/* Contenido del perfil */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            {/* Avatar */}
            <div className="relative -mt-16 md:-mt-20">
              <div 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-3xl md:text-4xl"
                style={{ backgroundColor: themeColor }}
              >
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Información del usuario */}
            <div className="flex-1 mt-4 md:mt-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>u/{user.username}</span>
                    <AdminBadge username={user.username} />
                  </h1>
                  {user.bio && (
                    <p className="text-gray-600 mb-3">{user.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {user.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user.website && (
                      <a 
                        href={user.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary-600"
                      >
                        <Globe className="w-4 h-4" />
                        <span>{user.website.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {user.created_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{t.user.memberSince} {new Date(user.created_at).getFullYear()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>{t.user.editProfile}</span>
                    </button>
                  ) : (
                    <FollowButton username={username} onFollowChange={loadProfile} />
                  )}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{t.user.followers}:</span>
                  <span className="font-bold text-gray-900">{user.followers || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{t.user.following}:</span>
                  <span className="font-bold text-gray-900">{user.following || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{t.user.karma}:</span>
                  <span className="font-bold text-primary-600">{user.karma || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">{t.user.publications}:</span>
                  <span className="font-bold text-gray-900">{posts.length}</span>
                </div>
              </div>

              {/* Links sociales */}
              {user.socialLinks && user.socialLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {user.socialLinks.map((link: any) => {
                    const Icon = socialIcons[link.platform.toLowerCase()] || Globe
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm capitalize">{link.platform}</span>
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Proyectos */}
      {user.projects && user.projects.length > 0 && (
        <motion.div
          className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t.user.projects}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.projects.map((project: any) => (
              <a
                key={project.id}
                href={project.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-primary-300 transition-colors"
              >
                {project.image_url && (
                  <img 
                    src={project.image_url} 
                    alt={project.title}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{project.title}</h3>
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                  )}
                  {project.category && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {project.category}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Posts del usuario */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">{t.user.publications}</h2>
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500">
              {isOwnProfile ? 'No has publicado nada aún' : 'Este usuario no ha publicado nada aún'}
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
                  <div className="text-gray-600 text-sm mb-3 line-clamp-2">
                    <PostContentRenderer content={post.content} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comment_count} {t.post.comments}</span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {showEditModal && isOwnProfile && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false)
            loadProfile()
          }}
        />
      )}
    </div>
  )
}
