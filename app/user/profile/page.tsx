'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import EditProfileModal from '@/components/EditProfileModal'
import { useI18n } from '@/lib/i18n/context'

function ProfileSettingsContent() {
  const { t, language } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadUser()
    
    // Verificar si hay mensajes de éxito/error
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    
    if (connected) {
      alert(
        language === 'es' 
          ? `¡${connected.charAt(0).toUpperCase() + connected.slice(1)} conectado exitosamente!`
          : `${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`
      )
      // Limpiar URL
      router.replace('/user/profile')
    }
    
    if (error) {
      alert(
        language === 'es' 
          ? `Error al conectar: ${error}`
          : `Connection error: ${error}`
      )
      router.replace('/user/profile')
    }
  }, [searchParams, router, language])

  const loadUser = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">{t.user.notFound}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {language === 'es' ? 'Configuración de Perfil' : 'Profile Settings'}
        </h1>
        <button
          onClick={() => setShowEditModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          {t.user.editProfile}
        </button>
      </div>

      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false)
            loadUser()
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

export default function ProfileSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <ProfileSettingsContent />
    </Suspense>
  )
}

