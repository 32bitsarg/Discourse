'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, UserPlus, Twitter, Calendar, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { useSettings } from '@/lib/hooks/useSettings'
import { useRouter } from 'next/navigation'
import Recaptcha from './Recaptcha'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
  onRegister: (username: string, email: string, password: string, birthdate?: string, captchaToken?: string) => Promise<void>
}

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin, onRegister }: RegisterModalProps) {
  const { t, language } = useI18n()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [minimumAge, setMinimumAge] = useState(13)
  const [captchaRequired, setCaptchaRequired] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  // OPTIMIZACIÓN: Usar SWR para obtener settings
  const { settings } = useSettings()
  
  useEffect(() => {
    if (isOpen && settings) {
      const age = parseInt(settings.minimumAge || '13', 10)
      setMinimumAge(age)
      setCaptchaRequired(settings.captcha_on_registration === true)
    }
  }, [isOpen, settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validaciones mejoradas
    if (!username || username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres')
      return
    }

    if (username.length > 20) {
      setError('El nombre de usuario no puede tener más de 20 caracteres')
      return
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor ingresa un email válido')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validar fecha de nacimiento si hay edad mínima
    if (minimumAge > 0 && !birthdate) {
      setError(`Debes proporcionar tu fecha de nacimiento (edad mínima: ${minimumAge} años)`)
      return
    }

    if (birthdate) {
      const birthDate = new Date(birthdate)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (age < minimumAge) {
        setError(`Debes tener al menos ${minimumAge} años para registrarte`)
        return
      }
    }

    // Verificar CAPTCHA si está requerido
    if (captchaRequired && !captchaToken) {
      setError('Por favor completa la verificación CAPTCHA')
      return
    }

    setLoading(true)

    try {
      await onRegister(username, email, password, birthdate, captchaToken || undefined)
      setUsername('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setBirthdate('')
      setCaptchaToken(null)
      onClose()
    } catch (err: any) {
      const errorData = err instanceof Error ? err : { message: t.common.error }
      const errorMessage = errorData.message || t.common.error
      
      // Verificar si requiere verificación de email
      if (errorData && typeof errorData === 'object' && 'requiresVerification' in errorData && errorData.requiresVerification) {
        setRequiresVerification(true)
        setRegisteredEmail(email)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token)
  }

  const handleCaptchaError = () => {
    setError('Error al verificar CAPTCHA. Por favor recarga la página.')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t.auth.signUp}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Botón de Twitter/X - Deshabilitado temporalmente */}
              {/* 
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/api/auth/twitter/login'
                }}
                className="w-full px-4 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mb-4"
              >
                <Twitter className="w-5 h-5" />
                {language === 'es' ? 'Registrarse con X' : 'Sign up with X'}
              </button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    {language === 'es' ? 'o' : 'or'}
                  </span>
                </div>
              </div>
              */}

              {requiresVerification ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      ¡Registro exitoso!
                    </h3>
                    <p className="text-green-800 mb-4">
                      Hemos enviado un email de verificación a <strong>{registeredEmail}</strong>
                    </p>
                    <p className="text-sm text-green-700 mb-4">
                      Por favor revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => {
                          setRequiresVerification(false)
                          onClose()
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Entendido
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/auth/verify-email', { method: 'POST' })
                            if (res.ok) {
                              setError('')
                              alert('Email de verificación reenviado. Revisa tu bandeja de entrada.')
                            } else {
                              const data = await res.json()
                              setError(data.message || 'Error al reenviar email')
                            }
                          } catch (err) {
                            setError('Error al reenviar email')
                          }
                        }}
                        className="px-4 py-2 bg-white border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Reenviar Email
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.auth.username}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="usuario123"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      minLength={3}
                      maxLength={20}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.auth.email}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.auth.password}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t.auth.confirmPassword}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {minimumAge > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="inline w-4 h-4 mr-1" />
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - minimumAge)).toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required={minimumAge > 0}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Debes tener al menos {minimumAge} años para registrarte
                    </p>
                  </div>
                )}

                {captchaRequired && (
                  <div className="py-2">
                    <Recaptcha onVerify={handleCaptchaVerify} onError={handleCaptchaError} />
                    <p className="text-xs text-gray-500 mt-1">
                      Este sitio está protegido por reCAPTCHA
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (captchaRequired && !captchaToken)}
                  className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      {t.auth.signUp}
                    </>
                  )}
                </button>
              </form>
              )}

              {!requiresVerification && (
                <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  {t.auth.haveAccount}{' '}
                  <button
                    onClick={onSwitchToLogin}
                    className="text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    {t.auth.loginHere}
                  </button>
                </p>
              </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

