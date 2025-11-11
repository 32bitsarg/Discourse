import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discourse - Alternativa a Reddit en Español | Comunidad Virtual y Foro de Discusión',
  description: 'Discourse es la mejor alternativa a Reddit en español. Crea y gestiona comunidades virtuales, foros de discusión, comunidades de usuarios y plataformas colaborativas. Herramientas de community engagement y gestión de comunidades.',
  keywords: 'reddit español, alternativa a reddit, comunidad virtual, construir comunidad, foro comunitario, debate online, foro de discusión, como crear comunidad, reddit clone, crear red social, plataforma colaborativa, comunidad de usuarios, red social alternativa, foro interactivo, community engagement, branded community, comunidad de marca, gestión de comunidades, community board, build community',
  openGraph: {
    title: 'Discourse - Alternativa a Reddit en Español',
    description: 'Crea y gestiona comunidades virtuales, foros de discusión y plataformas colaborativas',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discourse - Alternativa a Reddit en Español',
    description: 'Crea y gestiona comunidades virtuales, foros de discusión y plataformas colaborativas',
  },
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

