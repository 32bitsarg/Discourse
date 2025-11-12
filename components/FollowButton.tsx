'use client'

import { useState, useEffect } from 'react'
import { UserPlus, UserMinus } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface FollowButtonProps {
  username: string
  onFollowChange?: (following: boolean) => void
}

export default function FollowButton({ username, onFollowChange }: FollowButtonProps) {
  const { t } = useI18n()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    // Verificar estado de follow
    fetch(`/api/user/${username}/follow`)
      .then(res => res.json())
      .then(data => {
        if (data.following !== undefined) {
          setFollowing(data.following)
        }
      })
      .catch(() => {
      })
      .finally(() => {
        setLoading(false)
      })
  }, [username])

  const handleFollow = async () => {
    if (updating) return

    setUpdating(true)
    const method = following ? 'DELETE' : 'POST'
    
    try {
      const res = await fetch(`/api/user/${username}/follow`, { method })
      const data = await res.json()
      
      if (data.success !== undefined) {
        setFollowing(data.following)
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

