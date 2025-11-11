'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, MessageSquare, Lock, Globe, Plus, Search } from 'lucide-react'
import ForumLayout from '@/components/ForumLayout'
import CreateSubforumModal from '@/components/CreateSubforumModal'

export default function ForumsPage() {
  const [subforums, setSubforums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: number; username: string } | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Verificar usuario
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})

    // Cargar comunidades
    loadSubforums()
  }, [])

  const loadSubforums = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subforums')
      const data = await res.json()
      setSubforums(data.subforums || [])
    } catch (error) {
      console.error('Error loading subforums:', error)
      setSubforums([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubforum = async (data: { name: string; description: string; isPublic: boolean; requiresApproval: boolean }) => {
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

      loadSubforums()
      setIsCreateModalOpen(false)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear la comunidad')
    }
  }

  // Filtrar comunidades por búsqueda
  const filteredSubforums = subforums.filter(subforum =>
    subforum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subforum.description && subforum.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <ForumLayout>
      <div className="space-y-6">
        <CreateSubforumModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSubforum}
        />

        {/* Header */}
        <motion.div
          className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Comunidades</h1>
              <p className="text-sm sm:text-base text-gray-600">Descubre y únete a comunidades de tu interés</p>
            </div>
            {user && (
              <motion.button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm sm:text-base self-start sm:self-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Crear Comunidad</span>
                <span className="sm:hidden">Crear</span>
              </motion.button>
            )}
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar comunidades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Lista de Comunidades */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : filteredSubforums.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              {searchQuery ? 'No se encontraron comunidades' : 'No hay comunidades aún'}
            </p>
            {user && !searchQuery && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                Crea la primera comunidad
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSubforums.map((subforum) => (
              <motion.div
                key={subforum.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
              >
                <Link href={`/r/${subforum.slug}`}>
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0">
                          r/
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                              r/{subforum.name}
                            </h2>
                            {!subforum.is_public && (
                              <span title="Comunidad privada">
                                <Lock className="w-5 h-5 text-gray-500" />
                              </span>
                            )}
                            {subforum.is_public && (
                              <span title="Comunidad pública">
                                <Globe className="w-5 h-5 text-green-500" />
                              </span>
                            )}
                          </div>
                          {subforum.description && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {subforum.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="font-semibold">{subforum.member_count || 0}</span>
                        <span className="hidden sm:inline">miembros</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="font-semibold">{subforum.post_count || 0}</span>
                        <span className="hidden sm:inline">posts</span>
                      </div>
                      {subforum.requires_approval && (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-yellow-600">
                          <span>Requiere aprobación</span>
                        </div>
                      )}
                      <div className="ml-auto text-xs text-gray-500 whitespace-nowrap">
                        <span className="hidden sm:inline">Creado por </span>u/{subforum.creator_username || 'Anónimo'}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ForumLayout>
  )
}

