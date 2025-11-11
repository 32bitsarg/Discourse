'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, Plus, User, Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'

interface NavItem {
  name: string
  href: string
  icon: typeof Home
  badge?: number
}

export default function BottomNavigation() {
  const { t } = useI18n()
  const pathname = usePathname()
  const [user, setUser] = useState<{ id: number; username: string } | null>(null)

  const navItems: NavItem[] = [
    { name: t.nav.home, href: '/', icon: Home },
    { name: t.nav.forums, href: '/forums', icon: Users },
    { name: t.mobile.create, href: '#', icon: Plus, badge: undefined }, // Se maneja con FAB
    { name: t.auth.profile, href: '/user', icon: User },
  ]

  // Verificar usuario para mostrar perfil correcto
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

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(href)
  }

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Abrir modal de crear post mediante evento personalizado
    const event = new CustomEvent('openCreatePost', { bubbles: true })
    window.dispatchEvent(event)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom lg:hidden">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const isCreateButton = item.href === '#'

            if (isCreateButton) {
              return (
                <motion.button
                  key={item.name}
                  onClick={handleCreateClick}
                  className="flex flex-col items-center justify-center gap-1 flex-1 relative -mt-6"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 mt-1">{t.mobile.create}</span>
                </motion.button>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href === '/user' && user ? `/user/${user.username}` : item.href}
                className="flex flex-col items-center justify-center gap-1 flex-1 relative min-w-0"
              >
                <motion.div
                  className="flex flex-col items-center justify-center relative"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="relative">
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        active ? 'text-primary-600' : 'text-gray-500'
                      }`}
                    />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${
                      active ? 'text-primary-600' : 'text-gray-500'
                    }`}
                  >
                    {item.name}
                  </span>
                  {active && (
                    <motion.div
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary-600 rounded-full"
                      layoutId="activeIndicator"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

