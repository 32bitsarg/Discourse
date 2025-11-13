'use client'

import { useState, useEffect } from 'react'

export default function SiteNameClient() {
  const [siteName, setSiteName] = useState('Discourse')

  useEffect(() => {
    async function fetchSiteName() {
      try {
        const res = await fetch('/api/settings?key=site_name')
        if (res.ok) {
          const data = await res.json()
          if (data.value) {
            setSiteName(data.value)
          }
        }
      } catch (err) {
        // Mantener el valor por defecto
      }
    }

    fetchSiteName()
  }, [])

  return (
    <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-primary-500 bg-clip-text text-transparent">
      {siteName}
    </span>
  )
}

