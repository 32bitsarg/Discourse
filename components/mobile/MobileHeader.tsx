'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

export default function MobileHeader() {
  const { t } = useI18n()
  const [user, setUser] = useState<{ username: string; id: number; avatar_url?: string | null } | null>(null)
  const [avatarErrors, setAvatarErrors] = useState<{ [key: number]: boolean }>({})

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          if (data.user.id) {
            setAvatarErrors(prev => ({ ...prev, [data.user.id]: false }))
          }
        }
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 safe-area-top lg:hidden">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center h-14 px-4">
            {/* Logo - Centrado */}
            <Link href="/">
              <motion.div
                className="flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg font-black bg-gradient-to-r from-primary-600 via-purple-600 to-primary-500 bg-clip-text text-transparent">
                  Discourse
                </span>
              </motion.div>
            </Link>

            {/* User Link - Solo si hay usuario, posicionado a la derecha */}
            {user && (
              <Link href={`/user/${user.username}`} className="absolute right-4">
                <motion.div
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {user.avatar_url && user.avatar_url.trim() !== '' && !avatarErrors[user.id] ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-5 h-5 rounded-full object-cover border border-gray-300"
                      onError={() => {
                        setAvatarErrors(prev => ({ ...prev, [user.id]: true }))
                      }}
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-700 hidden sm:inline">
                    {user.username}
                  </span>
                </motion.div>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

