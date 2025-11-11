import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comunidades - Discourse | Crea y Gestiona tu Comunidad Virtual',
  description: 'Explora y crea comunidades virtuales en Discourse. La mejor plataforma para construir comunidades, gestionar foros y fomentar el engagement.',
  keywords: 'comunidades virtuales, crear comunidad, gestionar comunidad, foro comunitario, community board, build community',
}

export default function ForumsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

