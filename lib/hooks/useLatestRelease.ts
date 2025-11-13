import { useState, useEffect } from 'react'

interface ReleaseInfo {
  tag: string | null
  version: string | null
  name?: string
  body?: string
  publishedAt?: string
  downloadUrl: string | null
  zipUrl: string | null
  tarballUrl: string | null
  htmlUrl?: string
  available: boolean
  message?: string
  error?: string
}

export function useLatestRelease() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRelease() {
      try {
        const response = await fetch('/api/github/latest-release')
        if (!response.ok) {
          throw new Error('Error al obtener el release')
        }
        const data = await response.json()
        setRelease(data)
      } catch (err: any) {
        setError(err.message)
        // Si hay error, indicar que no hay versión disponible
        setRelease({
          tag: null,
          version: null,
          downloadUrl: null,
          zipUrl: null,
          tarballUrl: null,
          available: false,
          message: 'Estamos trabajando en la próxima versión',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRelease()
  }, [])

  return { release, loading, error }
}

