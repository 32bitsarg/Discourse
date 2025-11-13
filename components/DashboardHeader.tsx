'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Settings, LogOut, Home, Users } from 'lucide-react'
import SiteNameClient from './SiteNameClient'

export default function DashboardHeader() {
  const [user, setUser] = useState<{ username: string; id: number; avatar_url?: string | null } | null>(null)
  const [avatarError, setAvatarError] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/feed'
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/feed">
            <motion.div
              className="flex items-center gap-2 text-xl font-black cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SiteNameClient />
            </motion.div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <Link
              href="/feed"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Feed</span>
            </Link>
            <Link
              href="/forums"
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Comunidades</span>
            </Link>

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-3">
                {user.avatar_url && user.avatar_url.trim() !== '' && !avatarError ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover border border-gray-300"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

