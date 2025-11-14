import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCache, setCache } from '@/lib/redis'

const CACHE_KEY = 'stats:global'
const CACHE_TTL = 30 // 30 segundos (solo memoria, no Upstash - ahorra writes)

export async function GET(request: NextRequest) {
  try {
    // Intentar obtener del cache primero
    const cached = await getCache<{ members: number; postsToday: number; subforums: number }>(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Si no hay cache, obtener de la BD
    // OPTIMIZACIÓN: Una sola query en lugar de 3
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

    // Guardar en cache Redis
    await setCache(CACHE_KEY, stats, CACHE_TTL)

    // Caché HTTP para stats
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      },
    })
  } catch (error: any) {
    // Si las tablas no existen, devolver valores por defecto
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({
        members: 0,
        postsToday: 0,
        subforums: 0,
      })
    }
    
    return NextResponse.json({
      members: 0,
      postsToday: 0,
      subforums: 0,
    })
  }
}

