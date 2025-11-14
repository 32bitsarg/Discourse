import useSWR from 'swr'
import { fetcher } from './useSWRConfig'
import { useEffect } from 'react'

interface Settings {
  showVoteCounts: boolean
  allowDownvotes: boolean
  siteName: string
  siteLogo: string
  siteFavicon: string
  primaryColor: string
  headerBanner: string
  allowImagesInPosts: boolean
  allowVideosInPosts: boolean
  allowExternalLinks: boolean
  googleAnalyticsId: string
  minimumAge: string
  captcha_on_posts?: boolean
  captcha_on_registration?: boolean
}

const defaultSettings: Settings = {
  showVoteCounts: true,
  allowDownvotes: true,
  siteLogo: '',
  siteFavicon: '',
  primaryColor: '#6366f1',
  headerBanner: '',
  allowImagesInPosts: true,
  allowVideosInPosts: true,
  allowExternalLinks: true,
  googleAnalyticsId: '',
}

/**
 * Hook para obtener settings usando SWR
 * OPTIMIZACIÓN: Migrado de fetch a SWR para caché automática
 */
export function useSettings() {
  const { data, error, isLoading } = useSWR('/api/settings', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos - los settings no cambian frecuentemente
  })

  const settingsMap = data?.settings?.reduce((acc: any, setting: any) => {
    acc[setting.key_name] = setting.value
    return acc
  }, {}) || {}

  const settings: Settings = {
    showVoteCounts: settingsMap.show_vote_counts === 'true',
    allowDownvotes: settingsMap.allow_downvotes === 'true',
    siteName: settingsMap.site_name || 'Discourse',
    siteLogo: settingsMap.site_logo || '',
    siteFavicon: settingsMap.site_favicon || '',
    primaryColor: settingsMap.primary_color || '#6366f1',
    headerBanner: settingsMap.header_banner || '',
    allowImagesInPosts: settingsMap.allow_images_in_posts === 'true',
    allowVideosInPosts: settingsMap.allow_videos_in_posts === 'true',
    allowExternalLinks: settingsMap.allow_external_links === 'true',
    googleAnalyticsId: settingsMap.google_analytics_id || '',
    minimumAge: settingsMap.minimum_age || '13',
    captcha_on_posts: settingsMap.captcha_on_posts === 'true',
    captcha_on_registration: settingsMap.captcha_on_registration === 'true',
  }

  // Aplicar color primario dinámicamente
  useEffect(() => {
    if (settings.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', settings.primaryColor)
      // Generar variaciones del color para Tailwind
      const color = settings.primaryColor
      document.documentElement.style.setProperty('--primary-50', adjustColor(color, 0.95))
      document.documentElement.style.setProperty('--primary-100', adjustColor(color, 0.9))
      document.documentElement.style.setProperty('--primary-200', adjustColor(color, 0.75))
      document.documentElement.style.setProperty('--primary-300', adjustColor(color, 0.5))
      document.documentElement.style.setProperty('--primary-400', adjustColor(color, 0.25))
      document.documentElement.style.setProperty('--primary-500', color)
      document.documentElement.style.setProperty('--primary-600', darkenColor(color, 0.1))
      document.documentElement.style.setProperty('--primary-700', darkenColor(color, 0.2))
      document.documentElement.style.setProperty('--primary-800', darkenColor(color, 0.3))
      document.documentElement.style.setProperty('--primary-900', darkenColor(color, 0.4))
    }
  }, [settings.primaryColor])

  // Aplicar favicon
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

  return { 
    settings: isLoading ? defaultSettings : settings, 
    loading: isLoading,
    isError: error,
  }
}

// Helper functions para ajustar colores
function adjustColor(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) * (1 - amount))
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) * (1 - amount))
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) * (1 - amount))
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}
