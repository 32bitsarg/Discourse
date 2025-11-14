import { getAllSettings } from './settings'

export interface SiteSettings {
  siteName: string
  siteDescription: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  googleAnalyticsId: string
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await getAllSettings()
    const settingsMap = settings.reduce((acc: any, setting: any) => {
      acc[setting.key_name] = setting.value
      return acc
    }, {})

    return {
      siteName: settingsMap.site_name || 'Discourse',
      siteDescription: settingsMap.site_description || 'Plataforma de foros y comunidades',
      metaTitle: settingsMap.meta_title || '',
      metaDescription: settingsMap.meta_description || '',
      metaKeywords: settingsMap.meta_keywords || '',
      googleAnalyticsId: settingsMap.google_analytics_id || '',
    }
  } catch (error) {
    console.error('Error obteniendo settings:', error)
    return {
      siteName: 'Discourse',
      siteDescription: 'Plataforma de foros y comunidades',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      googleAnalyticsId: '',
    }
  }
}

