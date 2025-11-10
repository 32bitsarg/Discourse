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
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users') as any[]
    const [postCount] = await pool.execute('SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) = CURDATE()') as any[]
    const [subforumCount] = await pool.execute('SELECT COUNT(*) as count FROM subforums') as any[]

    const stats = {
      members: userCount[0]?.count || 0,
      postsToday: postCount[0]?.count || 0,
      subforums: subforumCount[0]?.count || 0,
    }

    // Guardar en cache
    await setCache(CACHE_KEY, stats, CACHE_TTL)

    return NextResponse.json(stats)
  } catch (error: any) {
    // Si las tablas no existen, devolver valores por defecto
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({
        members: 0,
        postsToday: 0,
        subforums: 0,
      })
    }
    
    console.error('Get stats error:', error)
    return NextResponse.json({
      members: 0,
      postsToday: 0,
      subforums: 0,
    })
  }
}

