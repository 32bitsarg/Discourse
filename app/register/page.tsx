'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'free'

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    ownerEmail: '',
    ownerUsername: '',
    ownerPassword: '',
    ownerPasswordConfirm: '',
    customDomain: '',
  })

  // Verificar disponibilidad del slug
  useEffect(() => {
    if (formData.slug.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkSlugAvailability(formData.slug)
      }, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setSlugAvailable(null)
    }
  }, [formData.slug])

  const checkSlugAvailability = async (slug: string) => {
    if (slug.length < 3) return

    setCheckingSlug(true)
    try {
      const res = await fetch(`/api/tenants/check-slug?slug=${encodeURIComponent(slug)}`)
      const data = await res.json()
      setSlugAvailable(data.available)
    } catch (err) {
      setSlugAvailable(null)
    } finally {
      setCheckingSlug(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validaciones
    if (formData.ownerPassword !== formData.ownerPasswordConfirm) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (formData.ownerPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      setLoading(false)
      return
    }

    if (slugAvailable !== true) {
      setError('Por favor, elige un slug disponible')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/tenants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          ownerEmail: formData.ownerEmail,
          ownerUsername: formData.ownerUsername,
          ownerPassword: formData.ownerPassword,
          customDomain: formData.customDomain || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Error al crear el tenant')
      }

      // Redirigir al nuevo tenant
      if (data.tenant?.url) {
        window.location.href = data.tenant.url
      } else {
        router.push(`/`)
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear el tenant')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crea tu propio foro
          </h1>
          <p className="text-gray-600 mb-8">
            En solo unos minutos tendrás tu comunidad lista para usar
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Foro */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Información del Foro
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Foro
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Mi Comunidad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del Foro (slug)
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">https://</span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => {
                        const slug = e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, '')
                          .replace(/-+/g, '-')
                          .replace(/^-|-$/g, '')
                        setFormData({ ...formData, slug })
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="mi-comunidad"
                      minLength={3}
                      maxLength={50}
                    />
                    <span className="text-gray-500 ml-2">
                      .{process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'discourse.com'}
                    </span>
                  </div>
                  {formData.slug && (
                    <div className="mt-2 flex items-center text-sm">
                      {checkingSlug ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400 mr-2" />
                      ) : slugAvailable === true ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : slugAvailable === false ? (
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                      ) : null}
                      <span
                        className={
                          slugAvailable === true
                            ? 'text-green-600'
                            : slugAvailable === false
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }
                      >
                        {checkingSlug
                          ? 'Verificando...'
                          : slugAvailable === true
                          ? 'Este slug está disponible'
                          : slugAvailable === false
                          ? 'Este slug ya está en uso'
                          : 'El slug debe tener al menos 3 caracteres'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dominio Personalizado (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.customDomain}
                    onChange={(e) =>
                      setFormData({ ...formData, customDomain: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="mi-foro.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Solo disponible en planes Pro y Enterprise
                  </p>
                </div>
              </div>
            </div>

            {/* Información del Administrador */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Tu Cuenta de Administrador
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ownerUsername}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerUsername: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="admin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.ownerEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerEmail: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.ownerPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.ownerPasswordConfirm}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerPasswordConfirm: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Repite tu contraseña"
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || slugAvailable !== true}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creando tu foro...
                </span>
              ) : (
                'Crear Mi Foro'
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              Al crear tu foro, aceptas nuestros{' '}
              <a href="/terms" className="text-indigo-600 hover:underline">
                Términos de Servicio
              </a>{' '}
              y{' '}
              <a href="/privacy" className="text-indigo-600 hover:underline">
                Política de Privacidad
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

