'use client'

import { useEffect } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'

export default function GoogleAnalytics() {
  const { settings } = useSettings()

  useEffect(() => {
    if (!settings.googleAnalyticsId || settings.googleAnalyticsId.trim() === '') {
      return
    }

    const script1 = document.createElement('script')
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`
    document.head.appendChild(script1)

    const script2 = document.createElement('script')
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${settings.googleAnalyticsId}');
    `
    document.head.appendChild(script2)

    return () => {
      // Cleanup: remover scripts cuando el componente se desmonte
      const scripts = document.querySelectorAll(`script[src*="googletagmanager"], script:contains("gtag")`)
      scripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      })
    }
  }, [settings.googleAnalyticsId])

  return null
}

