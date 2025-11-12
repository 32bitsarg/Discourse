import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { getCache, setCache } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ subforums: [] })
    }

    // Cache key específico por usuario
    const cacheKey = `user:${user.id}:communities`
    const cached = await getCache<{ subforums: any[] }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Obtener comunidades donde el usuario es miembro aprobado
    // También incluir comunidades donde el usuario es el creador (aunque no esté en subforum_members)
    const [subforums] = await pool.execute(`
      SELECT DISTINCT
        s.id,
        s.name,
        s.slug,
        s.description,
        s.member_count,
        s.post_count,
        s.image_url,
        s.banner_url,
        s.is_public,
        s.requires_approval,
        s.creator_id,
        COALESCE(sm.role, 
          CASE WHEN s.creator_id = ? THEN 'admin' ELSE 'member' END
        ) as role
      FROM subforums s
      LEFT JOIN subforum_members sm ON s.id = sm.subforum_id AND sm.user_id = ? AND sm.status = 'approved'
      WHERE (sm.user_id = ? AND sm.status = 'approved') OR s.creator_id = ?
      ORDER BY 
        CASE 
          WHEN s.creator_id = ? THEN 0
          WHEN COALESCE(sm.role, 'member') = 'admin' THEN 1
          WHEN COALESCE(sm.role, 'member') = 'moderator' THEN 2
          ELSE 3
        END,
        s.name ASC
    `, [user.id, user.id, user.id, user.id, user.id]) as any[]

    const result = { subforums: subforums || [] }

    // Cache por 5 minutos
    await setCache(cacheKey, result, 300)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get my communities error:', error)
    return NextResponse.json({ subforums: [] })
  }
}

