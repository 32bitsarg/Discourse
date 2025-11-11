import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  return {
    title: `r/${slug} - Discourse | Comunidad Virtual`,
    description: `Únete a la comunidad ${slug} en Discourse. Foro de discusión, debate online y engagement comunitario.`,
    keywords: `comunidad ${slug}, foro ${slug}, debate online, comunidad virtual`,
  }
}

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

