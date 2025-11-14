import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'

/**
 * GET - Obtener posts guardados del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const [savedPosts] = await pool.execute(`
      SELECT 
        p.id,
        p.title,
        p.slug,
        SUBSTRING(p.content, 1, 500) as content_preview,
        p.upvotes,
        p.downvotes,
        p.comment_count,
        p.created_at,
        p.author_id,
        u.username as author_username,
        s.name as subforum_name,
        s.slug as subforum_slug,
        sp.created_at as saved_at
      FROM saved_posts sp
      INNER JOIN posts p ON sp.post_id = p.id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN subforums s ON p.subforum_id = s.id
      WHERE sp.user_id = ?
      ORDER BY sp.created_at DESC
      LIMIT ? OFFSET ?
    `, [user.id, limit, offset]) as any[]

    // Formatear fechas
    const formattedPosts = savedPosts.map((post: any) => ({
      ...post,
      created_at: post.created_at?.toISOString() || null,
      saved_at: post.saved_at?.toISOString() || null,
    }))

    // Caché HTTP corto (1 min) - los posts guardados cambian cuando se guardan/desguardan
    return NextResponse.json({
      posts: formattedPosts,
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'private, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'private, s-maxage=60',
      },
    })
  } catch (error) {
    console.error('Error obteniendo posts guardados:', error)
    return NextResponse.json(
      { message: 'Error al obtener los posts guardados' },
      { status: 500 }
    )
  }
}

