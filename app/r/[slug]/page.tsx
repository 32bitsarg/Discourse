'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Users, MessageSquare, Lock, Globe } from 'lucide-react'
import PostFeed, { PostFeedRef } from '@/components/PostFeed'
import CreatePostBox from '@/components/CreatePostBox'
import JoinCommunityButton from '@/components/JoinCommunityButton'
import CommunityRequestsPanel from '@/components/CommunityRequestsPanel'

export default function CommunityPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [community, setCommunity] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userMembership, setUserMembership] = useState<{ isMember: boolean; role?: string } | null>(null)
  const postFeedRef = useRef<PostFeedRef>(null)

  useEffect(() => {
    if (!slug) return

    setLoading(true)
    Promise.all([
      fetch('/api/subforums').then(res => res.json()),
      fetch('/api/auth/me').then(res => res.json()).catch(() => ({ user: null }))
    ])
      .then(([subforumsData, authData]) => {
        const found = subforumsData.subforums?.find((s: any) => s.slug === slug)
        if (found) {
          setCommunity(found)
          
          // Verificar membresía del usuario
          if (authData.user) {
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
        console.error('Error loading community:', err)
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
        <p className="text-gray-500 text-lg">Comunidad no encontrada</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Volver al inicio
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
            <span className="text-sm">Volver</span>
          </motion.div>
        </Link>

        {/* Header de la comunidad */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                  r/
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                      r/{community.name}
                    </h1>
                    {!community.is_public && (
                      <span title="Comunidad privada">
                        <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      </span>
                    )}
                    {community.is_public && (
                      <span title="Comunidad pública">
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Creado por u/{community.creator_username}
                  </p>
                </div>
              </div>
              {community.description && (
                <p className="text-sm sm:text-base text-gray-700 mt-3">{community.description}</p>
              )}
            </div>
            <div className="sm:ml-4 flex-shrink-0">
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
              <span className="hidden sm:inline">miembros</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-semibold">{community.post_count}</span>
              <span className="hidden sm:inline">posts</span>
            </div>
            {community.requires_approval && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-yellow-600">
                <span>Requiere aprobación</span>
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
      </div>
  )
}

