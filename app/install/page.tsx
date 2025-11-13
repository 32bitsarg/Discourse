'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Database, User, Settings, Rocket } from 'lucide-react'

export default function InstallPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    dbHost: 'localhost',
    dbPort: '3306',
    dbUser: 'root',
    dbPassword: '',
    dbName: 'discourse',
    siteName: 'Mi Foro',
    adminUsername: 'admin',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    redisUrl: '',
    redisToken: '',
  })

  // Verificar si ya está instalado
  useEffect(() => {
    checkInstallation()
  }, [])

  const checkInstallation = async () => {
    try {
      const res = await fetch('/api/install/check')
      const data = await res.json()
      
      if (data.installed && data.hasAdmin) {
        setIsInstalled(true)
        // Redirigir al feed después de 2 segundos
        setTimeout(() => {
          router.push('/feed')
        }, 2000)
      }
    } catch (err) {
      console.error('Error checking installation:', err)
    } finally {
      setChecking(false)
    }
  }

  // Probar conexión a BD
  const testConnection = async () => {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/install/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbHost: formData.dbHost,
          dbPort: formData.dbPort,
          dbUser: formData.dbUser,
          dbPassword: formData.dbPassword,
          dbName: formData.dbName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Error conectando a la base de datos')
      }

      // Si la conexión es exitosa, avanzar al siguiente paso
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Error conectando a la base de datos')
    } finally {
      setLoading(false)
    }
  }

  // Crear tablas
  const createTables = async () => {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/install/create-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbHost: formData.dbHost,
          dbPort: formData.dbPort,
          dbUser: formData.dbUser,
          dbPassword: formData.dbPassword,
          dbName: formData.dbName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Error creando las tablas')
      }

      // Si las tablas se crearon exitosamente, avanzar al siguiente paso
      setStep(3)
    } catch (err: any) {
      setError(err.message || 'Error creando las tablas')
    } finally {
      setLoading(false)
    }
  }

  // Crear admin y finalizar instalación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validaciones
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (formData.adminPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbHost: formData.dbHost,
          dbPort: formData.dbPort,
          dbUser: formData.dbUser,
          dbPassword: formData.dbPassword,
          dbName: formData.dbName,
          siteName: formData.siteName,
          adminUsername: formData.adminUsername,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          redisUrl: formData.redisUrl || undefined,
          redisToken: formData.redisToken || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Error durante la instalación')
      }

      // Instalación exitosa
      setStep(4)
      // Redirigir después de mostrar mensaje de éxito
      setTimeout(() => {
        router.push('/feed')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Error durante la instalación')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando instalación...</p>
        </div>
      </div>
    )
  }

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Instalación Completada!
          </h1>
          <p className="text-gray-600 mb-4">
            Tu foro ya está instalado. Redirigiendo...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Rocket className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bienvenido a Discourse
          </h1>
          <p className="text-xl text-gray-600">
            Configura tu foro en unos pocos pasos
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {step === 4 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Instalación Completada!
            </h2>
            <p className="text-gray-600 mb-6">
              Tu foro está listo. Serás redirigido en unos segundos...
            </p>
            <div className="bg-indigo-50 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Importante:</strong> Actualiza tu archivo <code className="bg-white px-1 rounded">.env.local</code> con las credenciales de base de datos:
              </p>
              <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`DB_HOST=${formData.dbHost}
DB_PORT=${formData.dbPort}
DB_USER=${formData.dbUser}
DB_PASSWORD=${formData.dbPassword}
DB_NAME=${formData.dbName}
SESSION_SECRET=genera_un_secret_aleatorio_aqui
${formData.redisUrl ? `UPSTASH_REDIS_REST_URL=${formData.redisUrl}` : ''}
${formData.redisToken ? `UPSTASH_REDIS_REST_TOKEN=${formData.redisToken}` : ''}`}
              </pre>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
            {/* Paso 1: Base de Datos */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Database className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Configuración de Base de Datos
                    </h2>
                    <p className="text-gray-600">Conecta tu foro a MySQL</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Host de MySQL
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.dbHost}
                      onChange={(e) => setFormData({ ...formData, dbHost: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="localhost"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Puerto
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.dbPort}
                        onChange={(e) => setFormData({ ...formData, dbPort: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="3306"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de BD
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.dbName}
                        onChange={(e) => setFormData({ ...formData, dbName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="discourse"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuario de MySQL
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.dbUser}
                      onChange={(e) => setFormData({ ...formData, dbUser: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="root"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña de MySQL
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.dbPassword}
                      onChange={(e) => setFormData({ ...formData, dbPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={testConnection}
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Probando conexión...
                      </span>
                    ) : (
                      'Probar Conexión y Continuar'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Paso 2: Crear Tablas */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Database className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Crear Tablas de Base de Datos
                    </h2>
                    <p className="text-gray-600">Conexión exitosa. Ahora crearemos las tablas necesarias.</p>
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    Se crearán todas las tablas necesarias para el funcionamiento del foro.
                  </p>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={createTables}
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creando tablas...
                      </span>
                    ) : (
                      'Crear Tablas y Continuar'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Paso 3: Información del Foro y Admin */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Información del Foro
                    </h2>
                    <p className="text-gray-600">Configura tu foro y cuenta de administrador</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Foro
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.siteName}
                      onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Mi Foro"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Cuenta de Administrador
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre de Usuario
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.adminUsername}
                          onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
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
                          value={formData.adminEmail}
                          onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="admin@ejemplo.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contraseña
                        </label>
                        <input
                          type="password"
                          required
                          value={formData.adminPassword}
                          onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
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
                          value={formData.adminPasswordConfirm}
                          onChange={(e) => setFormData({ ...formData, adminPasswordConfirm: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Repite tu contraseña"
                          minLength={8}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Redis (Opcional)
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL de Upstash Redis
                        </label>
                        <input
                          type="text"
                          value={formData.redisUrl}
                          onChange={(e) => setFormData({ ...formData, redisUrl: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Token de Upstash Redis
                        </label>
                        <input
                          type="password"
                          value={formData.redisToken}
                          onChange={(e) => setFormData({ ...formData, redisToken: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Finalizando instalación...
                      </span>
                    ) : (
                      'Finalizar Instalación'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

