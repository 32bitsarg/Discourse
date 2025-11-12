'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Home, TrendingUp, Zap, Star, Plus, Shield, Crown } from 'lucide-react'
import Link from 'next/link'
import CreateSubforumModal from './CreateSubforumModal'
import { useI18n } from '@/lib/i18n/context'

export default function Sidebar() {
  const { t } = useI18n()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [user, setUser] = useState<{ id: number; username: string } | null>(null)
  const [stats, setStats] = useState({ members: 0, postsToday: 0, subforums: 0 })
  const [communities, setCommunities] = useState<any[]>([])
  const [myCommunities, setMyCommunities] = useState<any[]>([])

  useEffect(() => {
    // Verificar si hay usuario logueado
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})

    // Obtener estadísticas
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {})

    // Obtener top 5 comunidades más activas
    fetch('/api/subforums/top')
      .then(res => res.json())
      .then(data => setCommunities(data.subforums || []))
      .catch(() => {})

    // Obtener mis comunidades si hay usuario logueado
    if (user) {
      fetch('/api/subforums/my-communities')
        .then(res => res.json())
        .then(data => {
          // También necesitamos obtener image_url y banner_url
          const communitiesWithImages = (data.subforums || []).map((comm: any) => ({
            ...comm,
            image_url: comm.image_url || null,
            banner_url: comm.banner_url || null,
          }))
          setMyCommunities(communitiesWithImages)
        })
        .catch(() => {})
    }
  }, [user])

  const handleCreateSubforum = async (data: { name: string; description: string; isPublic: boolean; requiresApproval: boolean; image_url?: string; banner_url?: string }) => {
    if (!user) {
      alert('Debes iniciar sesión para crear una comunidad')
      return
    }

    try {
      const res = await fetch('/api/subforums/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al crear la comunidad')
      }

      // Recargar comunidades
      const [communitiesRes, myCommunitiesRes] = await Promise.all([
        fetch('/api/subforums/top').then(res => res.json()),
        user ? fetch('/api/subforums/my-communities').then(res => res.json()).catch(() => ({ subforums: [] })) : Promise.resolve({ subforums: [] })
      ])
      setCommunities(communitiesRes.subforums || [])
      if (user) {
        const communitiesWithImages = (myCommunitiesRes.subforums || []).map((comm: any) => ({
          ...comm,
          image_url: comm.image_url || null,
          banner_url: comm.banner_url || null,
        }))
        setMyCommunities(communitiesWithImages)
      }
      setIsCreateModalOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear la comunidad')
    }
  }

  const handleCreateClick = () => {
    if (!user) {
      alert('Debes iniciar sesión para crear una comunidad')
      return
    }
    setIsCreateModalOpen(true)
  }

  return (
    <div className="space-y-6 sticky top-20">
      <CreateSubforumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubforum}
      />
      
      {/* Quick Navigation */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-gray-900 font-bold mb-3 text-sm uppercase tracking-wider">
          {t.sidebar.quickNav}
        </h3>
        <div className="space-y-2">
          <Link href="/">
            <motion.div
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <Home className="w-5 h-5 text-primary-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">{t.nav.home}</span>
            </motion.div>
          </Link>
          <Link href="/?filter=hot">
            <motion.div
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <TrendingUp className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">{t.nav.trends}</span>
            </motion.div>
          </Link>
          <Link href="/?filter=new">
            <motion.div
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors group cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <Zap className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">{t.nav.new}</span>
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Communities List - Estilo Reddit */}
      <motion.div
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider">
            {t.community.communities}
          </h3>
          <motion.button
            onClick={handleCreateClick}
            className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-3 h-3" />
            {t.community.createCommunity}
          </motion.button>
        </div>
        
        {communities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-2">{t.community.noCommunities}</p>
            {user && (
              <button
                onClick={handleCreateClick}
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
              >
                {t.community.createFirst}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {communities.map((community) => (
              <Link key={community.id} href={`/r/${community.slug}`}>
                <motion.div
                  className="flex items-center justify-between px-2 py-2 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors group cursor-pointer"
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {community.image_url ? (
                      <img
                        src={community.image_url}
                        alt={community.name}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-gray-200"
                        onError={(e) => {
                          // Si falla la imagen, ocultar y mostrar el fallback
                          (e.target as HTMLImageElement).style.display = 'none'
                          const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                          if (fallback) {
                            fallback.style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 bg-gradient-to-br from-primary-500 to-purple-500 ${community.image_url ? 'hidden' : ''}`}
                    >
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium truncate group-hover:text-primary-600">
                      r/{community.name}
                    </span>
                  </div>
                  {community.post_count > 0 && (
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {community.post_count}
                    </span>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Mis Comunidades */}
      {user && (
        <motion.div
          className="bg-white rounded-lg border border-gray-200 shadow-sm p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-3">
            Mis comunidades
          </h3>
          
          {myCommunities.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-2">No eres miembro de ninguna comunidad</p>
              <button
                onClick={handleCreateClick}
                className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
              >
                Crear una comunidad
              </button>
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {myCommunities.map((community) => {
                const isAdmin = community.role === 'admin' || community.creator_id === user.id
                const isMod = community.role === 'moderator'
                
                return (
                  <Link key={community.id} href={`/r/${community.slug}`}>
                    <motion.div
                      className="flex items-center justify-between px-2 py-2 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors group cursor-pointer"
                      whileHover={{ x: 2 }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {community.image_url ? (
                          <img
                            src={community.image_url}
                            alt={community.name}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                              const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                              if (fallback) {
                                fallback.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 bg-gradient-to-br from-primary-500 to-purple-500 ${community.image_url ? 'hidden' : ''}`}
                        >
                          {community.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium truncate group-hover:text-primary-600">
                          r/{community.name}
                        </span>
                        {isAdmin && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 flex-shrink-0" title="Administrador">
                            <Crown className="w-2.5 h-2.5" />
                            Admin
                          </span>
                        )}
                        {isMod && !isAdmin && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 flex-shrink-0" title="Moderador">
                            <Shield className="w-2.5 h-2.5" />
                            Mod
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Community Stats */}
      <motion.div
        className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg border border-primary-200 p-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="text-gray-900 font-bold text-sm">{t.sidebar.stats}</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>{t.community.members}</span>
            <span className="text-gray-900 font-semibold">{stats.members}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>{t.community.postsToday}</span>
            <span className="text-gray-900 font-semibold">{stats.postsToday}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>{t.community.communities}</span>
            <span className="text-gray-900 font-semibold">{stats.subforums}</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
