'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, UserMinus, CheckCircle, Clock } from 'lucide-react'

interface JoinCommunityButtonProps {
  subforumId: number
  isPublic: boolean
  requiresApproval: boolean
}

export default function JoinCommunityButton({ 
  subforumId, 
  isPublic, 
  requiresApproval 
}: JoinCommunityButtonProps) {
  const [membershipStatus, setMembershipStatus] = useState<{
    isMember: boolean
    status: 'pending' | 'approved' | 'rejected' | null
  }>({ isMember: false, status: null })
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    loadMembershipStatus()
  }, [subforumId])

  const loadMembershipStatus = async () => {
    try {
      const res = await fetch(`/api/subforums/${subforumId}/members/status`)
      const data = await res.json()
      setMembershipStatus({
        isMember: data.isMember || false,
        status: data.status || null,
      })
    } catch (error) {
      console.error('Error loading membership status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    setJoining(true)
    try {
      const res = await fetch(`/api/subforums/${subforumId}/join`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Error al unirse a la comunidad')
        return
      }

      // Recargar estado
      await loadMembershipStatus()

      if (data.status === 'pending') {
        alert('Solicitud enviada. Esperando aprobación del moderador.')
      }
    } catch (error) {
      alert('Error al unirse a la comunidad')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('¿Estás seguro de que quieres salir de esta comunidad?')) {
      return
    }

    setJoining(true)
    try {
      const res = await fetch(`/api/subforums/${subforumId}/join`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.message || 'Error al salir de la comunidad')
        return
      }

      // Recargar estado
      await loadMembershipStatus()
    } catch (error) {
      alert('Error al salir de la comunidad')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
    )
  }

  if (membershipStatus.isMember) {
    return (
      <motion.button
        onClick={handleLeave}
        disabled={joining}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
        whileHover={{ scale: joining ? 1 : 1.02 }}
        whileTap={{ scale: joining ? 1 : 0.98 }}
      >
        <UserMinus className="w-4 h-4" />
        {joining ? 'Saliendo...' : 'Salir'}
      </motion.button>
    )
  }

  if (membershipStatus.status === 'pending') {
    return (
      <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg flex items-center gap-2 text-sm font-medium border border-yellow-200">
        <Clock className="w-4 h-4" />
        Pendiente
      </div>
    )
  }

  return (
    <motion.button
      onClick={handleJoin}
      disabled={joining}
      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
      whileHover={{ scale: joining ? 1 : 1.02 }}
      whileTap={{ scale: joining ? 1 : 0.98 }}
    >
      <UserPlus className="w-4 h-4" />
      {joining ? 'Uniéndose...' : 'Unirse'}
    </motion.button>
  )
}

