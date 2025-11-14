import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { getCache, setCache } from '@/lib/redis'

const CACHE_KEY_STATS = 'stats:global'
const CACHE_KEY_TOP = 'subforums:top5'
const CACHE_TTL_STATS = 30
const CACHE_TTL_TOP = 300

/**
 * Endpoint optimizado que combina todos los datos del sidebar
 * Reduce de 3-4 requests a 1 solo request
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const userId = user?.id || null

    // Cargar datos en paralelo
    const [statsData, topCommunitiesData, myCommunitiesData] = await Promise.all([
      // Stats (con caché)
      (async () => {
        const cached = await getCache<{ members: number; postsToday: number; subforums: number }>(CACHE_KEY_STATS)
        if (cached) {
          return cached
        }

        // Optimizar: una sola query con subqueries
        const [result] = await pool.execute(`
          SELECT 
            (SELECT COUNT(*) FROM users) as members,
            (SELECT COUNT(*) FROM posts WHERE DATE(created_at) = CURDATE()) as postsToday,
            (SELECT COUNT(*) FROM subforums) as subforums
        `) as any[]

        const stats = {
          members: result[0]?.members || 0,
          postsToday: result[0]?.postsToday || 0,
          subforums: result[0]?.subforums || 0,
        }

        await setCache(CACHE_KEY_STATS, stats, CACHE_TTL_STATS)
        return stats
      })(),

      // Top communities (con caché)
      (async () => {
        const cached = await getCache<{ subforums: any[] }>(CACHE_KEY_TOP)
        if (cached) {
          return cached.subforums || []
        }

        // Optimizar: usar JOINs en lugar de subqueries
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
        await setCache(CACHE_KEY_TOP, result, CACHE_TTL_TOP)
        return subforums || []
      })(),

      // My communities (solo si hay usuario)
      (async () => {
        if (!userId) return []

        const [myCommunities] = await pool.execute(`
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
            s.creator_id,
            u.username as creator_username
          FROM subforums s
          LEFT JOIN users u ON s.creator_id = u.id
          INNER JOIN subforum_members sm ON s.id = sm.subforum_id
          WHERE sm.user_id = ? AND sm.status = 'approved'
          ORDER BY s.post_count DESC, s.created_at DESC
          LIMIT 10
        `, [userId]) as any[]

        return myCommunities || []
      })(),
    ])

    const result = {
      user: user ? {
        id: user.id,
        username: user.username,
      } : null,
      stats: statsData,
      topCommunities: topCommunitiesData,
      myCommunities: myCommunitiesData,
    }

    // Caché HTTP para sidebar data
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=300',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
      },
    })
  } catch (error) {
    console.error('Error obteniendo datos del sidebar:', error)
    return NextResponse.json({
      user: null,
      stats: { members: 0, postsToday: 0, subforums: 0 },
      topCommunities: [],
      myCommunities: [],
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30',
      },
    })
  }
}

