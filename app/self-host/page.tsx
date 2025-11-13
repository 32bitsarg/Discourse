'use client'

import { motion } from 'framer-motion'
import { Download, Code, Database, Server, CheckCircle, Github, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLatestRelease } from '@/lib/hooks/useLatestRelease'
import LandingHeader from '@/components/LandingHeader'

export default function SelfHostPage() {
  const { release, loading } = useLatestRelease()
  
  const githubRepo = process.env.NEXT_PUBLIC_GITHUB_REPO || 'tu-usuario/discourse'
  const githubUrl = `https://github.com/${githubRepo}`
  const downloadUrl = release?.downloadUrl || null
  const cloneUrl = `${githubUrl}.git`
  const hasRelease = release?.available === true
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <LandingHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Self-Hosting Discourse
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hostea tu propia instancia de Discourse con control total sobre tus datos
          </p>
          {loading ? (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Verificando versión...</span>
            </div>
          ) : hasRelease && release?.version ? (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg">
              <span className="text-sm font-medium">Versión más reciente:</span>
              <span className="text-sm font-bold">{release.version}</span>
            </div>
          ) : (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
              <span className="text-sm font-medium">{release?.message || 'Estamos trabajando en la próxima versión'}</span>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ¿Por qué self-hosting?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Control Total
                </h3>
                <p className="text-gray-600 text-sm">
                  Tus datos permanecen en tus servidores. Controla completamente
                  la infraestructura y configuración.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Personalización Ilimitada
                </h3>
                <p className="text-gray-600 text-sm">
                  Modifica el código fuente, agrega características personalizadas
                  y adapta la plataforma a tus necesidades.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Sin Límites
                </h3>
                <p className="text-gray-600 text-sm">
                  Sin restricciones de usuarios, comunidades o almacenamiento.
                  Escala según tus necesidades.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Gratis y Open Source
                </h3>
                <p className="text-gray-600 text-sm">
                  El código es completamente gratuito y open source bajo licencia MIT.
                  Úsalo como quieras.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Instalación Rápida
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Clonar el Repositorio
                </h3>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 ml-11">
                <code className="text-green-400 text-sm">
                  git clone {cloneUrl}
                  <br />
                  cd discourse
                  {hasRelease && release?.tag && (
                    <>
                      <br />
                      git checkout {release.tag}
                    </>
                  )}
                </code>
              </div>
              {hasRelease && release?.version && (
                <p className="text-gray-600 text-sm mt-2 ml-11">
                  Versión actual: <span className="font-semibold">{release.version}</span>
                </p>
              )}
              {!hasRelease && !loading && (
                <p className="text-yellow-600 text-sm mt-2 ml-11">
                  {release?.message || 'Estamos trabajando en la próxima versión'}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Instalar Dependencias
                </h3>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 ml-11">
                <code className="text-green-400 text-sm">
                  npm install
                </code>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Ejecutar Instalador
                </h3>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 ml-11">
                <code className="text-green-400 text-sm">
                  npm run setup-app
                </code>
              </div>
              <p className="text-gray-600 text-sm mt-2 ml-11">
                El instalador te guiará paso a paso: configuración de BD, creación de tablas y usuario admin
              </p>
            </div>

            <div>
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                  4
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Iniciar Servidor
                </h3>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 ml-11">
                <code className="text-green-400 text-sm">
                  npm run dev
                </code>
              </div>
              <p className="text-gray-600 text-sm mt-2 ml-11">
                Abre <code className="bg-gray-100 px-1 rounded">http://localhost:3000</code> en tu navegador
              </p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Requisitos del Sistema
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Server className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Servidor</h3>
              <p className="text-gray-600 text-sm">
                Node.js 18+<br />
                2GB RAM mínimo<br />
                10GB almacenamiento
              </p>
            </div>
            <div className="text-center">
              <Database className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Base de Datos</h3>
              <p className="text-gray-600 text-sm">
                MySQL 8.0+<br />
                Redis (opcional pero recomendado)
              </p>
            </div>
            <div className="text-center">
              <Code className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Desarrollo</h3>
              <p className="text-gray-600 text-sm">
                Git<br />
                npm o yarn<br />
                Conocimientos básicos de Node.js
              </p>
            </div>
          </div>
        </div>

        {/* Installer Info */}
        <div className="bg-indigo-50 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🚀 Instalador Interactivo
          </h2>
          <p className="text-gray-700 mb-4">
            El instalador (<code className="bg-white px-1 rounded">npm run setup-app</code>) te guía paso a paso:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>Verifica requisitos del sistema (Node.js, MySQL)</li>
            <li>Configura la base de datos interactivamente</li>
            <li>Crea el archivo .env.local automáticamente</li>
            <li>Crea todas las tablas necesarias</li>
            <li>Opcionalmente crea un usuario administrador</li>
            <li>Verifica que todo esté correcto</li>
          </ul>
          <p className="text-gray-600 text-sm">
            No necesitas conocimientos técnicos avanzados. El instalador hace todo por ti.
          </p>
        </div>

        {/* Manual Installation */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Instalación Manual (Alternativa)
          </h2>
          <p className="text-gray-600 mb-4">
            Si prefieres configurar todo manualmente:
          </p>
          <div className="bg-gray-900 rounded-lg p-4">
            <code className="text-green-400 text-sm">
              cp .env.example .env.local<br />
              # Edita .env.local con tus credenciales<br />
              npm run create-tables
            </code>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          {loading ? (
            <div className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Cargando...
            </div>
          ) : hasRelease && downloadUrl ? (
            <>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors mr-4"
              >
                <Download className="w-5 h-5 mr-2" />
                Descargar {release?.version ? `v${release.version}` : 'Código'}
              </a>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                <Github className="w-5 h-5 mr-2" />
                Ver en GitHub
              </a>
            </>
          ) : (
            <>
              <div className="inline-flex items-center px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg font-medium mb-4">
                <span>{release?.message || 'Estamos trabajando en la próxima versión'}</span>
              </div>
              <div>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  <Github className="w-5 h-5 mr-2" />
                  Ver en GitHub
                </a>
              </div>
            </>
          )}
          <p className="text-gray-600 mt-4">
            ¿Necesitas ayuda? Consulta nuestra{' '}
            <Link href="/docs" className="text-indigo-600 hover:underline">
              documentación completa
            </Link>{' '}
            o{' '}
            <a href="mailto:support@discourse.com" className="text-indigo-600 hover:underline">
              contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

