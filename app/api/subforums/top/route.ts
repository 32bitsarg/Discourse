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
    // OPTIMIZACIÓN: Usar JOINs en lugar de subqueries para mejor rendimiento
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
        COALESCE(posts_today.count, 0) as posts_today,
        (s.member_count + COALESCE(posts_today.count, 0)) as activity_score
      FROM subforums s
      LEFT JOIN users u ON s.creator_id = u.id
      LEFT JOIN (
        SELECT subforum_id, COUNT(*) as count
        FROM posts
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        GROUP BY subforum_id
      ) posts_today ON s.id = posts_today.subforum_id
      WHERE s.is_public = TRUE 
        AND (s.requires_approval = FALSE OR s.requires_approval IS NULL)
      ORDER BY activity_score DESC, s.member_count DESC, s.post_count DESC
      LIMIT 5
    `) as any[]

    const result = { subforums: subforums || [] }

    // Guardar en cache Redis
    await setCache(CACHE_KEY, result, CACHE_TTL)

    // Caché HTTP adicional
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ subforums: [] })
  }
}

