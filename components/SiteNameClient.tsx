'use client'

import { useSettings } from '@/lib/hooks/useSettings'

export default function SiteNameClient() {
  // OPTIMIZACIÓN: Usar SWR para obtener site name
  const { settings } = useSettings()
  const siteName = settings.siteName || 'Discourse'

  return (
    <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-primary-500 bg-clip-text text-transparent">
      {siteName}
    </span>
  )
}

