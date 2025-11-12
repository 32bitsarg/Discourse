import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/posts/${id}`, {
      cache: 'no-store'
    })
    const post = await res.json()

    if (post.id) {
      return {
        title: `${post.title} - Discourse`,
        description: post.content.substring(0, 160),
        openGraph: {
          title: post.title,
          description: post.content.substring(0, 160),
          type: 'article',
        },
      }
    }
  } catch (error) {
  }

  return {
    title: 'Post - Discourse',
    description: 'Ver publicación en Discourse',
  }
}

