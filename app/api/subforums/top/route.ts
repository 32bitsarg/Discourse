import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCache, setCache } from '@/lib/redis'

const CACHE_KEY = 'subforums:top5'
const CACHE_TTL = 300 // 5 minutos

export async function GET(request: NextRequest) {
  try {
    // Intentar obtener del cache primero
    const cached = await getCache<{ subforums: any[] }>(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Obtener top 5 comunidades más activas
    // Cálculo de actividad: miembros + posts del último día
    const [subforums] = await pool.execute(`
      SELECT
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
        s.created_at,
        s.name_changed_at,
        s.creator_id,
        u.username as creator_username,
        -- Posts del último día
        (SELECT COUNT(*) 
         FROM posts p 
         WHERE p.subforum_id = s.id 
         AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        ) as posts_today,
        -- Score de actividad: miembros + posts del día
        (s.member_count + 
         (SELECT COUNT(*) 
          FROM posts p 
          WHERE p.subforum_id = s.id 
          AND p.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
         )
        ) as activity_score
      FROM subforums s
      LEFT JOIN users u ON s.creator_id = u.id
      WHERE s.is_public = TRUE
      ORDER BY activity_score DESC, s.member_count DESC, s.post_count DESC
      LIMIT 5
    `) as any[]

    const result = { subforums: subforums || [] }

    // Guardar en cache
    await setCache(CACHE_KEY, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Get top subforums error:', error)
    return NextResponse.json({ subforums: [] })
  }
}

