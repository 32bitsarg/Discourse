'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Calendar, MessageSquare, MapPin, Globe, Github, Twitter, Linkedin, ExternalLink, Edit, Trash2, X, LogOut } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import FollowButton from '@/components/FollowButton'
import EditProfileModal from '@/components/EditProfileModal'
import AdminBadge from '@/components/AdminBadge'
import PostContentRenderer from '@/components/PostContentRenderer'
import RichTextEditor from '@/components/RichTextEditor'
import { useIsMobile } from '@/hooks/useIsMobile'

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
  const isMobile = useIsMobile()

  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ username: string; id: number } | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPostId, setEditingPostId] = useState<number | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadProfile = useCallback(() => {
    if (!username) return
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
      })
      .finally(() => {
        setLoading(false)
      })
  }, [username])

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
  }, [username, loadProfile])

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

  const isOwnProfile = useMemo(() => currentUser?.username === username, [currentUser?.username, username])
  const themeColor = useMemo(() => user.theme_color || '#6366f1', [user.theme_color])

  // Layout móvil estilo X
  if (isMobile) {
    return (
      <div className="space-y-0 -mx-3 sm:-mx-4 relative">
        {/* Banner */}
        <div 
          className="h-32 w-full relative z-0 overflow-hidden"
          style={{ 
            backgroundColor: themeColor,
          }}
        >
          {user.banner_url ? (
            <>
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              <img
                src={user.banner_url}
                alt={`${user.username} banner`}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                onLoad={(e) => {
                  const target = e.target as HTMLImageElement
                  const placeholder = target.previousElementSibling as HTMLElement
                  if (placeholder) placeholder.style.display = 'none'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.parentElement?.querySelector('.banner-fallback') as HTMLElement
                  if (fallback) fallback.style.display = 'block'
                }}
              />
              <div className="banner-fallback absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-500 opacity-80" style={{ display: 'none' }} />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-500 opacity-80"></div>
          )}
        </div>

        {/* Contenido del perfil móvil */}
        <div className="bg-white px-4 pb-4 relative z-10">
          {/* Avatar y botones de acción */}
          <div className="flex items-start justify-between -mt-12 mb-3 relative z-20">
            {/* Avatar */}
            <div 
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl relative z-30 overflow-hidden"
              style={{ backgroundColor: themeColor }}
            >
              {user.avatar_url ? (
                <>
                  <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                  <img 
                    src={user.avatar_url} 
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover relative z-10"
                    loading="lazy"
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement
                      const placeholder = target.previousElementSibling as HTMLElement
                      if (placeholder) placeholder.style.display = 'none'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </>
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>

            {/* Botones de acción */}
            {isOwnProfile ? (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Editar perfil
                </button>
                <button
                  onClick={async () => {
                    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                      await fetch('/api/auth/logout', { method: 'POST' })
                      router.push('/feed')
                      router.refresh()
                    }
                  }}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title={t.auth.logout}
                >
                  <LogOut className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <FollowButton username={username} onFollowChange={loadProfile} />
              </div>
            )}
          </div>

          {/* Información del usuario */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span>{user.username}</span>
              <AdminBadge username={user.username} />
            </h1>
            {user.bio && (
              <p className="text-sm text-gray-700 mb-2">{user.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <a 
                  href={user.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary-600 hover:underline"
                >
                  <Globe className="w-3 h-3" />
                  <span>{user.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {user.created_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{t.user.memberSince} {new Date(user.created_at).getFullYear()}</span>
                </div>
              )}
            </div>

            {/* Estadísticas */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-900">{user.following || 0}</span>
                <span className="text-gray-500">{t.user.following}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-900">{user.followers || 0}</span>
                <span className="text-gray-500">{t.user.followers}</span>
              </div>
            </div>
          </div>

          {/* Links sociales */}
          {user.socialLinks && user.socialLinks.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {user.socialLinks.map((link: any) => {
                const Icon = socialIcons[link.platform.toLowerCase()] || Globe
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                  >
                    <Icon className="w-3 h-3" />
                    <span className="capitalize">{link.platform}</span>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Posts del usuario */}
        <div className="border-t border-gray-200 relative z-10">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">{t.user.publications}</h2>
          </div>
          {posts.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">
                {isOwnProfile ? 'No has publicado nada aún' : 'Este usuario no ha publicado nada aún'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {posts.map((post) => (
                <motion.article
                  key={post.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs text-gray-500">
                    <Link
                      href={`/r/${post.subforum_slug}`}
                      className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      r/{post.subforum_name}
                    </Link>
                    <span>·</span>
                    <span>{post.timeAgo}</span>
                  </div>
                  <Link href={post.slug && post.subforum_slug ? `/r/${post.subforum_slug}/${post.slug}` : `/post/${post.id}`}>
                    <h3 className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors mb-1.5 line-clamp-2">
                      {post.title}
                    </h3>
                  </Link>
                  <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                    <PostContentRenderer content={post.content} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{post.comment_count}</span>
                    </div>
                  </div>
                  {(post.canEdit || post.canDelete) && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                      {post.canEdit && (
                        <button
                          onClick={() => {
                            setEditTitle(post.title)
                            setEditContent(post.content)
                            setEditingPostId(post.id)
                          }}
                          className="text-xs text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>{t.post.edit}</span>
                        </button>
                      )}
                      {post.canDelete && (
                        <button
                          onClick={() => setDeletingPostId(post.id)}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t.post.delete}</span>
                        </button>
                      )}
                    </div>
                  )}
                </motion.article>
              ))}
            </div>
          )}
        </div>

        {/* Modales para móvil */}
        {showEditModal && (
          <EditProfileModal
            onClose={() => setShowEditModal(false)}
            user={user}
            onSave={() => {
              loadProfile()
              setShowEditModal(false)
            }}
          />
        )}

        {editingPostId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t.post.edit}</h2>
                <button
                  onClick={() => {
                    setEditingPostId(null)
                    setEditTitle('')
                    setEditContent('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t.post.title}
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t.post.content}
                    </label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                      <RichTextEditor
                        value={editContent}
                        onChange={setEditContent}
                        placeholder={t.post.writePost}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t">
                <button
                  onClick={() => {
                    setEditingPostId(null)
                    setEditTitle('')
                    setEditContent('')
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  disabled={isEditing}
                >
                  {t.post.cancel}
                </button>
                <button
                  onClick={async () => {
                    if (!editTitle.trim() || !editContent.trim()) {
                      alert(t.post.title + ' y ' + t.post.content + ' son requeridos')
                      return
                    }

                    setIsEditing(true)
                    try {
                      const res = await fetch(`/api/posts/${editingPostId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: editTitle.trim(), content: editContent.trim() }),
                      })

                      if (!res.ok) {
                        const error = await res.json()
                        throw new Error(error.message || 'Error al editar el post')
                      }

                      setEditingPostId(null)
                      setEditTitle('')
                      setEditContent('')
                      loadProfile()
                    } catch (error) {
                      alert(error instanceof Error ? error.message : 'Error al editar el post')
                    } finally {
                      setIsEditing(false)
                    }
                  }}
                  disabled={isEditing || !editTitle.trim() || !editContent.trim()}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? t.post.editing : t.post.save}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {deletingPostId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6"
            >
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{t.post.confirmDelete}</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6">{t.post.confirmDeletePost}</p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeletingPostId(null)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  disabled={isDeleting}
                >
                  {t.post.cancel}
                </button>
                <button
                  onClick={async () => {
                    setIsDeleting(true)
                    try {
                      const res = await fetch(`/api/posts/${deletingPostId}`, {
                        method: 'DELETE',
                      })

                      if (!res.ok) {
                        const error = await res.json()
                        throw new Error(error.message || 'Error al eliminar el post')
                      }

                      setDeletingPostId(null)
                      loadProfile()
                    } catch (error) {
                      alert(error instanceof Error ? error.message : 'Error al eliminar el post')
                    } finally {
                      setIsDeleting(false)
                    }
                  }}
                  disabled={isDeleting}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

  // Layout desktop (original)
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
                <div className="flex items-center gap-2 flex-wrap">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                      >
                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{t.user.editProfile}</span>
                        <span className="sm:hidden">Editar</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                            await fetch('/api/auth/logout', { method: 'POST' })
                            router.push('/feed')
                            router.refresh()
                          }
                        }}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-xs sm:text-sm font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">{t.auth.logout}</span>
                        <span className="sm:hidden">Salir</span>
                      </button>
                    </>
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
          <div className="space-y-2 sm:space-y-4">
            {posts.map((post) => (
              <motion.article
                key={post.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm transition-colors overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-2 sm:p-4">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2 text-[10px] sm:text-xs text-gray-500">
                    <Link
                      href={`/r/${post.subforum_slug}`}
                      className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      r/{post.subforum_name}
                    </Link>
                    <span>•</span>
                    <span>{post.timeAgo}</span>
                  </div>
                  <Link href={post.slug && post.subforum_slug ? `/r/${post.subforum_slug}/${post.slug}` : `/post/${post.id}`}>
                    <h3 className="text-sm sm:text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors mb-1.5 sm:mb-2 cursor-pointer line-clamp-2">
                      {post.title}
                    </h3>
                  </Link>
                  <div className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                    <PostContentRenderer content={post.content} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{post.comment_count} {t.post.comments}</span>
                      </div>
                    </div>
                    {(post.canEdit || post.canDelete) && (
                      <div className="flex items-center gap-2">
                        {post.canEdit && (
                          <button
                            onClick={() => {
                              setEditTitle(post.title)
                              setEditContent(post.content)
                              setEditingPostId(post.id)
                            }}
                            className="text-xs text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
                            title={t.post.edit}
                          >
                            <Edit className="w-3 h-3" />
                            <span>{t.post.edit}</span>
                          </button>
                        )}
                        {post.canDelete && (
                          <button
                            onClick={() => setDeletingPostId(post.id)}
                            className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100"
                            title={t.post.delete}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{t.post.delete}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* Modal de edición de post */}
      {editingPostId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{t.post.edit}</h2>
              <button
                onClick={() => {
                  setEditingPostId(null)
                  setEditTitle('')
                  setEditContent('')
                }}
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
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setEditingPostId(null)
                  setEditTitle('')
                  setEditContent('')
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                disabled={isEditing}
              >
                {t.post.cancel}
              </button>
              <button
                onClick={async () => {
                  if (!editTitle.trim() || !editContent.trim()) {
                    alert(t.post.title + ' y ' + t.post.content + ' son requeridos')
                    return
                  }

                  setIsEditing(true)
                  try {
                    const res = await fetch(`/api/posts/${editingPostId}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: editTitle.trim(), content: editContent.trim() }),
                    })

                    if (!res.ok) {
                      const error = await res.json()
                      throw new Error(error.message || 'Error al editar el post')
                    }

                    setEditingPostId(null)
                    setEditTitle('')
                    setEditContent('')
                    loadProfile() // Recargar el perfil
                  } catch (error) {
                    alert(error instanceof Error ? error.message : 'Error al editar el post')
                  } finally {
                    setIsEditing(false)
                  }
                }}
                disabled={isEditing || !editTitle.trim() || !editContent.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditing ? t.post.editing : t.post.save}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de post */}
      {deletingPostId && (
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
                onClick={() => setDeletingPostId(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                disabled={isDeleting}
              >
                {t.post.cancel}
              </button>
              <button
                onClick={async () => {
                  setIsDeleting(true)
                  try {
                    const res = await fetch(`/api/posts/${deletingPostId}`, {
                      method: 'DELETE',
                    })

                    if (!res.ok) {
                      const error = await res.json()
                      throw new Error(error.message || 'Error al eliminar el post')
                    }

                    setDeletingPostId(null)
                    loadProfile() // Recargar el perfil
                  } catch (error) {
                    alert(error instanceof Error ? error.message : 'Error al eliminar el post')
                  } finally {
                    setIsDeleting(false)
                  }
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? t.post.deleting : t.post.delete}
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
