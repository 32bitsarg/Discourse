'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LogIn, UserPlus, Menu, X } from 'lucide-react'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
import SiteNameClient from './SiteNameClient'
import { useI18n } from '@/lib/i18n/context'

export default function LandingHeader() {
  const { t } = useI18n()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [user, setUser] = useState<{ username: string; id: number } | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    window.location.href = '/feed'
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
    window.location.href = '/feed'
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/landing">
              <motion.div
                className="flex items-center gap-2 text-xl sm:text-2xl font-black cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SiteNameClient />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/feed"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Explorar
              </Link>
              <Link
                href="/forums"
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
              >
                Comunidades
              </Link>
              {user ? (
                <Link
                  href="/feed"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Ir al Feed
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    {t.auth.login}
                  </button>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    {t.auth.register}
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden py-4 border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col gap-4">
                <Link
                  href="/feed"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-700 hover:text-primary-600 font-medium"
                >
                  Explorar
                </Link>
                <Link
                  href="/forums"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-700 hover:text-primary-600 font-medium"
                >
                  Comunidades
                </Link>
                {user ? (
                  <Link
                    href="/feed"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium text-center"
                  >
                    Ir al Feed
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        setIsLoginOpen(true)
                      }}
                      className="flex items-center justify-center gap-2 text-gray-700 font-medium"
                    >
                      <LogIn className="w-4 h-4" />
                      {t.auth.login}
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        setIsRegisterOpen(true)
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium"
                    >
                      {t.auth.register}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </nav>
      </motion.header>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
        onSwitchToRegister={() => {
          setIsLoginOpen(false)
          setIsRegisterOpen(true)
        }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={handleRegister}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false)
          setIsLoginOpen(true)
        }}
      />
    </>
  )
}

