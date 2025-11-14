import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LayoutWrapper from '@/components/LayoutWrapper'
import { I18nProvider } from '@/lib/i18n/context'
import SettingsProvider from '@/components/SettingsProvider'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { getSiteSettings } from '@/lib/get-settings-server'
import { SWRConfig } from 'swr'
import { swrConfig, fetcher } from '@/lib/hooks/useSWRConfig'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings()
  
  const title = siteSettings.metaTitle || siteSettings.siteName || 'Discourse - Alternativa a Reddit en Español | Comunidad Virtual y Foro de Discusión'
  const description = siteSettings.metaDescription || siteSettings.siteDescription || 'Discourse es la mejor alternativa a Reddit en español. Crea y gestiona comunidades virtuales, foros de discusión, comunidades de usuarios y plataformas colaborativas. Herramientas de community engagement y gestión de comunidades.'
  const keywords = siteSettings.metaKeywords || 'reddit español, alternativa a reddit, comunidad virtual, construir comunidad, foro comunitario, debate online, foro de discusión, como crear comunidad, reddit clone, crear red social, plataforma colaborativa, comunidad de usuarios, red social alternativa, foro interactivo, community engagement, branded community, comunidad de marca, gestión de comunidades, community board, build community'

  return {
    title,
    description,
    keywords,
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
      apple: '/favicon.svg',
      shortcut: '/favicon.svg',
    },
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteSettings.siteName || 'Discourse',
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#6366f1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleAnalytics />
        <ErrorBoundary>
          <SWRConfig value={{ ...swrConfig, fetcher }}>
            <I18nProvider>
              <SettingsProvider>
                <LayoutWrapper>{children}</LayoutWrapper>
              </SettingsProvider>
            </I18nProvider>
          </SWRConfig>
        </ErrorBoundary>
      </body>
    </html>
  )
}

