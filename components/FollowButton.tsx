'use client'

import { useState } from 'react'
import { UserPlus, UserMinus } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { useFollowStatus } from '@/lib/hooks/useUser'

interface FollowButtonProps {
  username: string
  onFollowChange?: (following: boolean) => void
}

export default function FollowButton({ username, onFollowChange }: FollowButtonProps) {
  const { t } = useI18n()
  // OPTIMIZACIÓN: Usar SWR para obtener estado de follow
  const { following, isLoading: loading, mutate } = useFollowStatus(username)
  const [updating, setUpdating] = useState(false)

  const handleFollow = async () => {
    if (updating) return

    setUpdating(true)
    const method = following ? 'DELETE' : 'POST'
    
    try {
      const res = await fetch(`/api/user/${username}/follow`, { method })
      const data = await res.json()
      
      if (data.success !== undefined) {
        // Revalidar estado usando SWR
        mutate()
        if (onFollowChange) {
          onFollowChange(data.following)
        }
      }
    } catch (error) {
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-2 bg-gray-200 rounded-lg animate-pulse w-24 h-9"></div>
    )
  }

  return (
    <button
      onClick={handleFollow}
      disabled={updating}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        following
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-primary-600 text-white hover:bg-primary-700'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {following ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span>{t.user.unfollow}</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>{t.user.follow}</span>
        </>
      )}
    </button>
  )
}

