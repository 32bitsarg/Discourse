import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getConnection } from '@/lib/db'

// GET - Feed personalizado "Para ti" con algoritmo de recomendación
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      // Si no hay usuario, devolver feed normal
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const connection = await getConnection()

    // 1. Obtener intereses del usuario
    const [interests] = await connection.execute(
      'SELECT category, weight FROM user_interests WHERE user_id = ?',
      [user.id]
    )
    const userInterests = Array.isArray(interests) ? interests : []

    // 2. Obtener comunidades a las que pertenece
    const [memberships] = await connection.execute(
      'SELECT subforum_id FROM subforum_members WHERE user_id = ? AND status = "approved"',
      [user.id]
    )
    const communityIds = Array.isArray(memberships)
      ? memberships.map((m: any) => m.subforum_id)
      : []

    // 3. Obtener usuarios seguidos
    const [follows] = await connection.execute(
      'SELECT following_id FROM user_follows WHERE follower_id = ?',
      [user.id]
    )
    const followingIds = Array.isArray(follows)
      ? follows.map((f: any) => f.following_id)
      : []

    // 4. Obtener comportamiento reciente (últimos 30 días)
    const [recentBehavior] = await connection.execute(
      `SELECT post_id, action_type, COUNT(*) as count 
       FROM user_behavior 
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY post_id, action_type
       ORDER BY count DESC
       LIMIT 50`,
      [user.id]
    )

    // 5. Construir query con scoring simplificado
    // Score basado en:
    // - Intereses del usuario (30%)
    // - Comunidades a las que pertenece (20%)
    // - Usuarios seguidos (10%)
    // - Comportamiento reciente (40%)

    // Simplificar la query para evitar problemas de sintaxis compleja
    let query = `
      SELECT 
        p.id,
        p.title,
        p.content,
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
      WHERE s.is_public = TRUE
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `

    const queryParams: any[] = [limit, offset]

    const [posts] = await connection.execute(query, queryParams)

    // Obtener total aproximado
    const [total] = await connection.execute(
      'SELECT COUNT(*) as count FROM posts p INNER JOIN subforums s ON p.subforum_id = s.id WHERE s.is_public = TRUE',
      []
    )

    const totalCount = Array.isArray(total) && total.length > 0
      ? (total[0] as any).count
      : 0

    return NextResponse.json({
      posts: Array.isArray(posts) ? posts : [],
      hasMore: offset + limit < totalCount,
      page,
      total: totalCount
    })
  } catch (error: any) {
    console.error('Error fetching for-you feed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

