import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/subforums`, {
      cache: 'no-store'
    })
    const data = await res.json()
    const community = data.subforums?.find((s: any) => s.slug === slug)

    if (community) {
      return {
        title: `r/${community.name} - Discourse`,
        description: community.description || `Comunidad ${community.name} en Discourse`,
        openGraph: {
          title: `r/${community.name}`,
          description: community.description || `Comunidad ${community.name}`,
          type: 'website',
        },
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }

  return {
    title: 'Comunidad - Discourse',
    description: 'Ver comunidad en Discourse',
  }
}

