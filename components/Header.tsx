'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, LogIn, UserPlus, User, LogOut, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
import SearchBar from './SearchBar'
import { useI18n } from '@/lib/i18n/context'

export default function Header() {
  const { t } = useI18n()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [user, setUser] = useState<{ username: string; id: number; avatar_url?: string | null } | null>(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [avatarErrors, setAvatarErrors] = useState<{ [key: number]: boolean }>({})
  const userMenuRef = useRef<HTMLDivElement>(null)

  const navLinks = [
    { name: t.nav.home, href: '/feed' },
    { name: t.community.communities, href: '/forums' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Verificar si hay usuario logueado
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
          // Resetear error de avatar cuando cambia el usuario
          if (data.user.id) {
            setAvatarErrors(prev => ({ ...prev, [data.user.id]: false }))
          }
        }
      })
      .catch(() => {})
  }, [])

  // Cerrar el menú del usuario al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

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
    if (data.user) {
      setUser(data.user)
      if (data.user.id) {
        setAvatarErrors(prev => ({ ...prev, [data.user.id]: false }))
      }
    }
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
    if (data.user) {
      setUser(data.user)
      if (data.user.id) {
        setAvatarErrors(prev => ({ ...prev, [data.user.id]: false }))
      }
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 hidden lg:block ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg'
            : 'bg-white'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/feed">
              <motion.div
                className="flex items-center gap-2 text-xl sm:text-2xl font-black cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-primary-500 bg-clip-text text-transparent">
                  Discourse
                </span>
              </motion.div>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:block flex-1 max-w-2xl mx-4">
              <SearchBar />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <motion.div
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors relative group cursor-pointer"
                    whileHover={{ y: -2 }}
                  >
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-purple-400 group-hover:w-full transition-all duration-300" />
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <motion.button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {user.avatar_url && user.avatar_url.trim() !== '' && !avatarErrors[user.id] ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-gray-300 flex-shrink-0"
                        onError={() => {
                          setAvatarErrors(prev => ({ ...prev, [user.id]: true }))
                        }}
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs sm:text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">{user.username}</span>
                    <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-600 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link
                          href={`/user/${user.username}`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {user.avatar_url && !avatarErrors[user.id] ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username}
                              className="w-5 h-5 rounded-full object-cover border border-gray-300"
                              onError={() => setAvatarErrors(prev => ({ ...prev, [user.id]: true }))}
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-xs">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{user.username}</span>
                            <span className="text-xs text-gray-500">{t.auth.profile}</span>
                          </div>
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout()
                            setIsUserMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-200"
                        >
                          <LogOut className="w-4 h-4" />
                          {t.auth.logout}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <motion.button
                    onClick={() => setIsLoginOpen(true)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t.auth.signIn}</span>
                    <span className="sm:hidden">{t.auth.login}</span>
                  </motion.button>
                  <motion.button
                    onClick={() => setIsRegisterOpen(true)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t.auth.signUp}</span>
                    <span className="sm:hidden">{t.auth.register}</span>
                  </motion.button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-primary-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden py-6 border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-gray-200 flex flex-col gap-2">
                  {user ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{user.username}</span>
                      </div>
                      <Link
                        href={`/user/${user.username}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        <User className="w-4 h-4" />
                        {t.auth.profile}
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        {t.auth.logout}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsLoginOpen(true)
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <LogIn className="w-4 h-4" />
                        {t.auth.signIn}
                      </button>
                      <button
                        onClick={() => {
                          setIsRegisterOpen(true)
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium"
                      >
                        <UserPlus className="w-4 h-4" />
                        {t.auth.signUp}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </nav>
      </motion.header>

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
    </>
  )
}
