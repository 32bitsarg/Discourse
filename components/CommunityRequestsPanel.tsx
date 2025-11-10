'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, UserX, Clock, Users } from 'lucide-react'

interface CommunityRequestsPanelProps {
  subforumId: number
  userRole: 'admin' | 'moderator'
}

export default function CommunityRequestsPanel({ subforumId, userRole }: CommunityRequestsPanelProps) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [subforumId])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/subforums/${subforumId}/requests`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (userId: number, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/subforums/${subforumId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.message || 'Error al gestionar la solicitud')
        return
      }

      // Recargar solicitudes
      loadRequests()
    } catch (error) {
      alert('Error al gestionar la solicitud')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">Solicitudes pendientes</h3>
        </div>
        <p className="text-sm text-gray-500">No hay solicitudes pendientes</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-gray-900">
          Solicitudes pendientes ({requests.length})
        </h3>
      </div>
      <div className="space-y-3">
        {requests.map((request) => (
          <motion.div
            key={request.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">u/{request.username}</span>
                {request.karma !== undefined && (
                  <span className="text-xs text-gray-500">Karma: {request.karma}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Solicitó unirse {new Date(request.requested_at).toLocaleDateString('es-AR')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => handleRequest(request.user_id, 'approve')}
                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Aprobar"
              >
                <UserCheck className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => handleRequest(request.user_id, 'reject')}
                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Rechazar"
              >
                <UserX className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

