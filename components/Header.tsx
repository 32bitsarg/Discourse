'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Menu, X, LogIn, UserPlus, User, LogOut, ChevronDown, Settings, BookmarkCheck } from 'lucide-react'
import Link from 'next/link'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
import SearchBar from './SearchBar'
import SiteNameClient from './SiteNameClient'
import NotificationsPanel from './NotificationsPanel'
import { useI18n } from '@/lib/i18n/context'
import { useSettings } from '@/lib/hooks/useSettings'
import { useUser, useIsAdmin } from '@/lib/hooks/useUser'

export default function Header() {
  const { t } = useI18n()
  const { settings } = useSettings()
  // OPTIMIZACIÓN: Usar SWR para obtener usuario y admin status
  const { user, mutate: mutateUser } = useUser()
  const { isAdmin } = useIsAdmin()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [avatarErrors, setAvatarErrors] = useState<{ [key: number]: boolean }>({})
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

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

  // Resetear error de avatar cuando cambia el usuario
  useEffect(() => {
    if (user?.id) {
      setAvatarErrors(prev => ({ ...prev, [user.id]: false }))
    }
  }, [user?.id])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen) {
        const target = event.target as HTMLElement
        if (!target.closest('.user-menu-container')) {
          setIsUserMenuOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

    // Revalidar usuario usando SWR
    mutateUser()
  }

  const handleRegister = async (username: string, email: string, password: string, birthdate?: string, captchaToken?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, birthdate, captchaToken }),
    })

    if (!res.ok) {
      const error = await res.json()
      // Si requiere verificación, lanzar error especial
      if (error.requiresVerification) {
        const verificationError = new Error(error.message || 'Registro exitoso. Verifica tu email.')
        ;(verificationError as any).requiresVerification = true
        throw verificationError
      }
      throw new Error(error.message || 'Error al registrarse')
    }

    const data = await res.json()
    
    // Si requiere verificación, no iniciar sesión automáticamente
    if (data.requiresVerification) {
      const verificationError = new Error(data.message || 'Registro exitoso. Verifica tu email.')
      ;(verificationError as any).requiresVerification = true
      throw verificationError
    }

    // Revalidar usuario usando SWR
    mutateUser()
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    // Revalidar usuario usando SWR (limpiará el caché)
    mutateUser()
  }

  return (
    <>
      {/* Banner/Header Image */}
      {settings.headerBanner && (
        <div className="fixed top-0 left-0 right-0 h-32 z-40 hidden lg:block">
          <img 
            src={settings.headerBanner} 
            alt="Banner" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 hidden lg:block ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg'
            : 'bg-white'
        } ${settings.headerBanner ? 'mt-32' : ''}`}
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
                {settings.siteLogo && (
                  <img 
                    src={settings.siteLogo} 
                    alt="Logo" 
                    className="h-8 w-auto object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <SiteNameClient />
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
                <>
                  <NotificationsPanel />
                  <Link
                    href="/saved"
                    className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                    title="Posts Guardados"
                  >
                    <BookmarkCheck className="w-5 h-5" />
                  </Link>
                  <div className="relative user-menu-container">
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
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                      >
                        <Link
                          href={`/user/${user.username}`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm">Mi Perfil</span>
                        </Link>
                        <Link
                          href="/saved"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <BookmarkCheck className="w-4 h-4" />
                          <span className="text-sm">Posts Guardados</span>
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Administración</span>
                          </Link>
                        )}
                        <div className="border-t border-gray-200 my-1" />
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            handleLogout()
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Cerrar Sesión</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>
                </>
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
                    <Link
                      href={`/user/${user.username}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
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
                      <span className="text-sm font-medium">{user.username}</span>
                    </Link>
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
