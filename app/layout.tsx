import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LayoutWrapper from '@/components/LayoutWrapper'
import { I18nProvider } from '@/lib/i18n/context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Discourse - Alternativa a Reddit en Español | Comunidad Virtual y Foro de Discusión',
    description: 'Discourse es la mejor alternativa a Reddit en español. Crea y gestiona comunidades virtuales, foros de discusión, comunidades de usuarios y plataformas colaborativas. Herramientas de community engagement y gestión de comunidades.',
    keywords: 'reddit español, alternativa a reddit, comunidad virtual, construir comunidad, foro comunitario, debate online, foro de discusión, como crear comunidad, reddit clone, crear red social, plataforma colaborativa, comunidad de usuarios, red social alternativa, foro interactivo, community engagement, branded community, comunidad de marca, gestión de comunidades, community board, build community',
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
    title: 'Discourse',
  },
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
        <I18nProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </I18nProvider>
      </body>
    </html>
  )
}

