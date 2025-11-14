'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Mail, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    const success = searchParams.get('success')

    if (success === 'true') {
      setStatus('success')
      setMessage('Tu email ha sido verificado exitosamente. Ya puedes iniciar sesión.')
      return
    }

    if (!token) {
      setStatus('error')
      setMessage('Token de verificación no proporcionado.')
      return
    }

    // Verificar token
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(res => {
        if (res.ok) {
          setStatus('success')
          setMessage('Tu email ha sido verificado exitosamente. Ya puedes iniciar sesión.')
        } else {
          return res.json().then(data => {
            if (data.message?.includes('expirado')) {
              setStatus('expired')
              setMessage(data.message || 'El token ha expirado.')
            } else {
              setStatus('error')
              setMessage(data.message || 'Error al verificar el email.')
            }
          })
        }
      })
      .catch(error => {
        setStatus('error')
        setMessage('Error al verificar el email. Por favor intenta de nuevo.')
      })
  }, [searchParams])

  const handleResend = async () => {
    setResending(true)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
      })

      if (res.ok) {
        setMessage('Email de verificación reenviado. Revisa tu bandeja de entrada.')
        setStatus('success')
      } else {
        const data = await res.json()
        setMessage(data.message || 'Error al reenviar el email.')
        setStatus('error')
      }
    } catch (error) {
      setMessage('Error al reenviar el email.')
      setStatus('error')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg max-w-md w-full p-8"
      >
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificando email...</h1>
            <p className="text-gray-600">Por favor espera mientras verificamos tu email.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Email verificado!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              href="/feed"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Ir al Feed
            </Link>
          </div>
        )}

        {(status === 'error' || status === 'expired') && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'expired' ? 'Token expirado' : 'Error de verificación'}
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Reenviar Email de Verificación
                  </>
                )}
              </button>
              <Link
                href="/feed"
                className="block text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Volver al Feed
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-primary-600 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

