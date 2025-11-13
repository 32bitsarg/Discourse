import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Self-Hosting Discourse - Descarga Gratis | Discourse',
  description: 'Descarga gratis nuestra plataforma de foros open source. Código completo, instalador web incluido y sin restricciones. Hostea tu propia instancia con control total.',
  keywords: 'self-hosting foros, descargar foro, código fuente foros, instalar foro propio, hostear foro, foro open source, descargar discourse, instalar discourse, foro gratuito, código abierto foros',
  openGraph: {
    title: 'Self-Hosting Discourse - Descarga Gratis',
    description: 'Descarga gratis nuestra plataforma de foros open source. Código completo, instalador web incluido.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Self-Hosting Discourse - Descarga Gratis',
    description: 'Descarga gratis nuestra plataforma de foros open source. Código completo, instalador web incluido.',
  },
}

export default function SelfHostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

