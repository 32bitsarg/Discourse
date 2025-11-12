'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PostFeed, { PostFeedRef } from '@/components/PostFeed'
import CreatePostBox from '@/components/CreatePostBox'
import FilterTabs from '@/components/FilterTabs'
import { useI18n } from '@/lib/i18n/context'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

function FeedContent() {
  const { t, language } = useI18n()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [filter, setFilter] = useState('for-you')
  const postFeedRef = useRef<PostFeedRef>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const error = searchParams.get('error')
    const description = searchParams.get('description')
    const twitterLogin = searchParams.get('twitter_login')
    const twitterConnected = searchParams.get('twitter_connected')

    if (error) {
      let message = ''
      if (error === 'access_denied') {
        message = language === 'es' 
          ? 'No se pudo autorizar la aplicación. Verifica la configuración en Twitter Developer Portal.'
          : 'Could not authorize the application. Check configuration in Twitter Developer Portal.'
      } else if (description) {
        message = decodeURIComponent(description)
      } else {
        message = language === 'es'
          ? `Error de autenticación: ${error}`
          : `Authentication error: ${error}`
      }
      setErrorMessage(message)
      
      // Limpiar URL después de mostrar el error
      setTimeout(() => {
        router.replace('/feed')
      }, 5000)
    }

    if (twitterLogin === 'success') {
      setSuccessMessage(
        language === 'es'
          ? '¡Inicio de sesión con X exitoso!'
          : 'Successfully signed in with X!'
      )
      setTimeout(() => {
        router.replace('/feed')
      }, 3000)
    }

    if (twitterConnected === 'true') {
      setSuccessMessage(
        language === 'es'
          ? '¡Cuenta de X conectada exitosamente!'
          : 'X account connected successfully!'
      )
      setTimeout(() => {
        router.replace('/feed')
      }, 3000)
    }
  }, [searchParams, router, language])

  return (
    <div className="space-y-4">
      {/* Mensajes de error/success */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">
              {language === 'es' ? 'Error de autenticación' : 'Authentication Error'}
            </p>
            <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
            {errorMessage.includes('Twitter Developer Portal') && (
              <div className="mt-3 text-sm text-red-600">
                <p className="font-medium mb-1">
                  {language === 'es' ? 'Verifica:' : 'Check:'}
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    {language === 'es'
                      ? 'Callback URI debe ser exactamente: https://www.discourse.click/api/auth/twitter/login/callback'
                      : 'Callback URI must be exactly: https://www.discourse.click/api/auth/twitter/login/callback'}
                  </li>
                  <li>
                    {language === 'es'
                      ? 'La app debe estar activa y configurada como OAuth 2.0'
                      : 'App must be active and configured as OAuth 2.0'}
                  </li>
                  <li>
                    {language === 'es'
                      ? 'Los scopes users.read y offline.access deben estar habilitados'
                      : 'Scopes users.read and offline.access must be enabled'}
                  </li>
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setErrorMessage(null)
              router.replace('/feed')
            }}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 flex-1">{successMessage}</p>
          <button
            onClick={() => {
              setSuccessMessage(null)
              router.replace('/feed')
            }}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <FilterTabs onFilterChange={setFilter} />
      <CreatePostBox               onPostCreated={() => {
                if (postFeedRef.current) {
          postFeedRef.current.refresh()
        }
      }} />
      <PostFeed ref={postFeedRef} filter={filter} />
    </div>
  )
}

export default function FeedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <FeedContent />
    </Suspense>
  )
}

