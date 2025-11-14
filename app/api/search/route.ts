import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = `%${query.trim()}%`

    // Buscar comunidades
    const [communities] = await pool.execute(
      `SELECT id, name, slug, description 
       FROM subforums 
       WHERE (name LIKE ? OR description LIKE ?) AND is_public = TRUE
       LIMIT 5`,
      [searchTerm, searchTerm]
    ) as any[]

    // Buscar usuarios
    const [users] = await pool.execute(
      `SELECT id, username, avatar_url, bio 
       FROM users 
       WHERE username LIKE ?
       LIMIT 5`,
      [searchTerm]
    ) as any[]

    // Buscar posts
    const [posts] = await pool.execute(
      `SELECT DISTINCT p.id, p.title, p.slug, p.content, p.author_id, 
              u.username as author_username, s.slug as subforum_slug
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN subforums s ON p.subforum_id = s.id
       WHERE p.title LIKE ? OR p.content LIKE ?
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [searchTerm, searchTerm]
    ) as any[]

    const results = [
      ...(communities || []).map((c: any) => ({
        type: 'community' as const,
        id: c.id,
        name: c.name,
        slug: c.slug,
        content: c.description,
      })),
      ...(users || []).map((u: any) => ({
        type: 'user' as const,
        id: u.id,
        username: u.username,
        name: u.username,
        content: u.bio,
      })),
      ...(posts || []).map((p: any) => ({
        type: 'post' as const,
        id: p.id,
        title: p.title,
        slug: p.slug,
        subforum_slug: p.subforum_slug,
        content: p.content?.substring(0, 100) + (p.content?.length > 100 ? '...' : ''),
        author: p.author_username,
      })),
    ]

    // Caché HTTP para búsquedas (corto porque los resultados cambian)
    return NextResponse.json({ results }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al realizar la búsqueda' },
      { status: 500 }
    )
  }
}

