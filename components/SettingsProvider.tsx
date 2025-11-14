'use client'

import { useEffect } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()

  // Aplicar favicon cuando cambie
  useEffect(() => {
    if (settings.siteFavicon) {
      const existingFavicon = document.querySelector("link[rel='icon']")
      if (existingFavicon) {
        existingFavicon.setAttribute('href', settings.siteFavicon)
      } else {
        const link = document.createElement('link')
        link.rel = 'icon'
        link.href = settings.siteFavicon
        document.head.appendChild(link)
      }
    }
  }, [settings.siteFavicon])

  return <>{children}</>
}

