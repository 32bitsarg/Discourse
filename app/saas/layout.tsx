import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crea tu Propio Foro - Plataforma SaaS de Foros | Discourse',
  description: 'Crea tu propio foro en minutos con nuestra plataforma SaaS. Hosting gestionado, configuración automática y sin necesidad de conocimientos técnicos. O descarga el código y hostea tu propia instancia. Planes desde gratis.',
  keywords: 'crear foro, plataforma foros saas, foro como servicio, crear comunidad virtual saas, hosting foros gestionado, plataforma foros propia, crear foro online, saas foros, self-hosting foros, código fuente foros, instalar foro propio, hostear foro, foro open source',
  openGraph: {
    title: 'Crea tu Propio Foro - Plataforma SaaS de Foros',
    description: 'Crea tu propio foro en minutos. Hosting gestionado o self-hosting, tú decides.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crea tu Propio Foro - Plataforma SaaS de Foros',
    description: 'Crea tu propio foro en minutos. Hosting gestionado o self-hosting, tú decides.',
  },
}

export default function SaasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

