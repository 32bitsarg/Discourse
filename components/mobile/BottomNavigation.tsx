'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, User, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import LoginModal from '../LoginModal'
import RegisterModal from '../RegisterModal'

interface NavItem {
  name: string
  href: string
  icon: typeof Home
  badge?: number
  isLogin?: boolean
}

export default function BottomNavigation() {
  const { t } = useI18n()
  const pathname = usePathname()
  const [user, setUser] = useState<{ id: number; username: string; avatar_url?: string | null } | null>(null)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  const navItems: NavItem[] = [
    { name: t.nav.home, href: '/feed', icon: Home },
    { name: t.nav.forums, href: '/forums', icon: Users },
    user 
      ? { name: t.auth.profile, href: '/user', icon: User }
      : { name: t.auth.login, href: '#', icon: LogIn, isLogin: true },
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

  const handleLogin = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || 'Error al iniciar sesión')
    }

    const data = await res.json()
    setUser(data.user)
    setIsLoginOpen(false)
  }

  const handleRegister = async (username: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || 'Error al registrarse')
    }

    const data = await res.json()
    setUser(data.user)
    setIsRegisterOpen(false)
  }

  const isActive = (href: string) => {
    if (href === '/feed') {
      return pathname === '/feed' || pathname === '/'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom lg:hidden">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            if (item.isLogin) {
              return (
                <motion.button
                  key={item.name}
                  onClick={() => setIsLoginOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 flex-1 relative min-w-0 h-full"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="relative">
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        active ? 'text-primary-600' : 'text-gray-500'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors ${
                      active ? 'text-primary-600' : 'text-gray-500'
                    }`}
                  >
                    {item.name}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 flex justify-center">
                    {active && (
                      <motion.div
                        className="w-8 h-full bg-primary-600 rounded-full"
                        layoutId="activeIndicator"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                </motion.button>
              )
            }

            // Si es el perfil y hay usuario, mostrar avatar
            const isProfileItem = item.href === '/user' && user

            return (
              <Link
                key={item.name}
                href={item.href === '/user' && user ? `/user/${user.username}` : item.href}
                className="flex flex-col items-center justify-center gap-1 flex-1 relative min-w-0 h-full"
              >
                <motion.div
                  className="flex flex-col items-center justify-center relative h-full"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="relative">
                    {isProfileItem && user ? (
                      user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className={`w-6 h-6 rounded-full object-cover border-2 transition-colors ${
                            active ? 'border-primary-600' : 'border-gray-300'
                          }`}
                          onError={(e) => {
                            // Si falla la imagen, mostrar inicial
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              const fallback = document.createElement('div')
                              fallback.className = `w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                                active ? 'bg-primary-600' : 'bg-gray-500'
                              }`
                              fallback.textContent = user.username.charAt(0).toUpperCase()
                              parent.appendChild(fallback)
                            }
                          }}
                        />
                      ) : (
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white ${
                            active ? 'bg-primary-600' : 'bg-gray-500'
                          }`}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )
                    ) : (
                      <Icon
                        className={`w-6 h-6 transition-colors ${
                          active ? 'text-primary-600' : 'text-gray-500'
                        }`}
                      />
                    )}
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
                </motion.div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 flex justify-center">
                  {active && (
                    <motion.div
                      className="w-8 h-full bg-primary-600 rounded-full"
                      layoutId="activeIndicator"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginOpen(false)
          setIsRegisterOpen(true)
        }}
        onLogin={handleLogin}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false)
          setIsLoginOpen(true)
        }}
        onRegister={handleRegister}
      />
    </nav>
  )
}

