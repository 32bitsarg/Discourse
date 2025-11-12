import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCache, setCache } from '@/lib/redis'

const CACHE_KEY = 'subforums:list'
const CACHE_TTL = 300 // 5 minutos (se guarda en Upstash porque TTL > 2min)

export async function GET(request: NextRequest) {
  try {
    // Intentar obtener del cache primero
    const cached = await getCache<{ subforums: any[] }>(CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Si no hay cache, obtener de la BD
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
            u.username as creator_username
          FROM subforums s
          LEFT JOIN users u ON s.creator_id = u.id
          ORDER BY s.post_count DESC, s.created_at DESC
          LIMIT 50
        `) as any[]

    const result = { subforums: subforums || [] }

    // Guardar en cache
    await setCache(CACHE_KEY, result, CACHE_TTL)

    return NextResponse.json(result)
  } catch (error: any) {
    // Si las tablas no existen, devolver array vacío
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({ subforums: [] })
    }
    
    return NextResponse.json({ subforums: [] })
  }
}

