import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feed - Discourse | Comunidad Virtual y Foro de Discusión',
  description: 'Explora el feed de Discourse, la mejor alternativa a Reddit en español. Descubre comunidades virtuales, foros de discusión y contenido relevante para ti.',
  keywords: 'feed comunidad, foro de discusión, comunidad virtual, alternativa a reddit, debate online',
}

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

