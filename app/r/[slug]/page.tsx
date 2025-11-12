'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Users, MessageSquare, Lock, Globe, Edit } from 'lucide-react'
import PostFeed, { PostFeedRef } from '@/components/PostFeed'
import CreatePostBox from '@/components/CreatePostBox'
import JoinCommunityButton from '@/components/JoinCommunityButton'
import CommunityRequestsPanel from '@/components/CommunityRequestsPanel'
import EditCommunityModal from '@/components/EditCommunityModal'
import { useI18n } from '@/lib/i18n/context'

export default function CommunityPage() {
  const { t } = useI18n()
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [community, setCommunity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userMembership, setUserMembership] = useState<{ isMember: boolean; role?: string } | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const postFeedRef = useRef<PostFeedRef>(null)

  useEffect(() => {
    if (!slug) return

    setLoading(true)
    Promise.all([
      fetch('/api/subforums?t=' + Date.now()).then(res => res.json()),
      fetch('/api/auth/me').then(res => res.json()).catch(() => ({ user: null }))
    ])
      .then(([subforumsData, authData]) => {
        const found = subforumsData.subforums?.find((s: any) => s.slug === slug)
        if (found) {
          // Asegurar que image_url y banner_url estén presentes
          const communityWithImages = {
            ...found,
            image_url: found.image_url || null,
            banner_url: found.banner_url || null,
          }
          setCommunity(communityWithImages)
          
          // Verificar membresía del usuario
          if (authData.user) {
            setCurrentUser(authData.user)
            fetch(`/api/subforums/${found.id}/members/status`)
              .then(res => res.json())
              .then(membershipData => {
                setUserMembership(membershipData)
              })
              .catch(() => {})
          }
        }
      })
      .catch(err => {
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-lg">{t.community.notFound}</p>
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
        <Link href="/">
          <motion.div
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            whileHover={{ x: -4 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t.post.back}</span>
          </motion.div>
        </Link>

        {/* Banner de la comunidad */}
        {community.banner_url && community.banner_url.trim() !== '' && (
          <motion.div
            className="w-full h-48 rounded-lg overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <img
              src={community.banner_url}
              alt={`${community.name} banner`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Si falla la imagen, ocultar el banner
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </motion.div>
        )}

        {/* Header de la comunidad */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                {community.image_url && community.image_url.trim() !== '' ? (
                  <img
                    src={community.image_url}
                    alt={community.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
                    onError={(e) => {
                      // Si falla la imagen, ocultar y mostrar inicial
                      (e.target as HTMLImageElement).style.display = 'none'
                      const parent = (e.target as HTMLImageElement).parentElement
                      if (parent) {
                        const fallback = parent.querySelector('.community-avatar-fallback')
                        if (fallback) {
                          (fallback as HTMLElement).style.display = 'flex'
                        }
                      }
                    }}
                  />
                ) : null}
                <div 
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0 ${community.image_url && community.image_url.trim() !== '' ? 'hidden community-avatar-fallback' : ''}`}
                >
                  {community.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      r/{community.name}
                    </h1>
                    {!community.is_public && (
                      <span title={t.community.private}>
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      </span>
                    )}
                    {community.is_public && (
                      <span title={t.community.public}>
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {t.community.createdBy} u/{community.creator_username}
                  </p>
                </div>
              </div>
              {community.description && (
                <p className="text-sm sm:text-base text-gray-700 mt-3">{community.description}</p>
              )}
            </div>
            <div className="sm:ml-4 flex-shrink-0 flex items-center gap-2">
              {currentUser && currentUser.id === community.creator_id && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
                  title="Editar comunidad"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
              )}
              <JoinCommunityButton
                subforumId={community.id}
                isPublic={community.is_public}
                requiresApproval={community.requires_approval || false}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-semibold">{community.member_count}</span>
              <span className="hidden sm:inline">{t.community.members}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-semibold">{community.post_count}</span>
              <span className="hidden sm:inline">{t.community.posts}</span>
            </div>
            {community.requires_approval && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-yellow-600">
                <span>{t.community.requiresApproval}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Panel de solicitudes (solo para admins/mods) */}
        {userMembership?.role && ['admin', 'moderator'].includes(userMembership.role) && (
          <CommunityRequestsPanel 
            subforumId={community.id} 
            userRole={userMembership.role as 'admin' | 'moderator'}
          />
        )}

            {/* Crear post */}
            <CreatePostBox 
              defaultSubforumId={community.id}
              onPostCreated={() => {
                // Actualizar el feed sin recargar la página
                if (postFeedRef.current) {
                  postFeedRef.current.refresh()
                }
              }}
            />

            {/* Posts de la comunidad */}
            <PostFeed ref={postFeedRef} filter="all" subforumId={parseInt(community.id)} />

            {/* Modal de edición */}
            {showEditModal && community && (
              <EditCommunityModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                community={{
                  id: community.id,
                  name: community.name,
                  description: community.description || '',
                  image_url: community.image_url,
                  banner_url: community.banner_url,
                  name_changed_at: community.name_changed_at,
                }}
                onSave={() => {
                  // Recargar la comunidad con cache invalidado
                  fetch('/api/subforums?t=' + Date.now())
                    .then(res => res.json())
                    .then(data => {
                      const found = data.subforums?.find((s: any) => s.slug === slug)
                      if (found) {
                        const communityWithImages = {
                          ...found,
                          image_url: found.image_url && found.image_url.trim() !== '' ? found.image_url : null,
                          banner_url: found.banner_url && found.banner_url.trim() !== '' ? found.banner_url : null,
                        }
                        setCommunity(communityWithImages)
                        // Forzar recarga de la página si el slug cambió
                        if (found.slug !== slug) {
                          router.push(`/r/${found.slug}`)
                        }
                      }
                    })
                    .catch(() => {})
                }}
              />
            )}
      </div>
  )
}

