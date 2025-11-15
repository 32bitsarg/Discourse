import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getConnection } from '@/lib/db'

// GET - Obtener feed de usuarios seguidos
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      // Si no hay usuario, retornar feed vacío en lugar de error
      return NextResponse.json({
        posts: [],
        hasMore: false,
        page: 1,
        total: 0
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const connection = await getConnection()

    // Obtener IDs de usuarios seguidos
    const [follows] = await connection.execute(
      'SELECT following_id FROM user_follows WHERE follower_id = ?',
      [user.id]
    )

    const followingIds = Array.isArray(follows) 
      ? follows.map((f: any) => f.following_id)
      : []

    if (followingIds.length === 0) {
      return NextResponse.json({
        posts: [],
        hasMore: false,
        page,
        total: 0
      })
    }

    // Obtener posts de usuarios seguidos
    const placeholders = followingIds.map(() => '?').join(',')
    const [posts] = await connection.execute(
      `SELECT 
        p.id,
        p.title,
        p.slug,
        SUBSTRING(p.content, 1, 500) as content_preview,
        p.upvotes,
        p.downvotes,
        p.comment_count,
        p.is_hot,
        p.created_at,
        p.subforum_id,
        u.id as author_id,
        u.username as author_username,
        u.avatar_url as author_avatar,
        s.name as subforum_name,
        s.slug as subforum_slug
      FROM posts p
      INNER JOIN users u ON p.author_id = u.id
      INNER JOIN subforums s ON p.subforum_id = s.id
      WHERE p.author_id IN (${placeholders})
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [...followingIds, limit, offset]
    )

    // Obtener total para paginación
    const [total] = await connection.execute(
      `SELECT COUNT(*) as count FROM posts WHERE author_id IN (${placeholders})`,
      [...followingIds]
    )

    const totalCount = Array.isArray(total) && total.length > 0 
      ? (total[0] as any).count 
      : 0

    // Caché HTTP para feed following
    return NextResponse.json({
      posts: Array.isArray(posts) ? posts : [],
      hasMore: offset + limit < totalCount,
      page,
      total: totalCount
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=300',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

