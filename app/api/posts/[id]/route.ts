import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCache, setCache } from '@/lib/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const postId = parseInt(id)

    if (isNaN(postId)) {
      return NextResponse.json(
        { message: 'ID de post inválido' },
        { status: 400 }
      )
    }

    // Intentar obtener del cache
    const cacheKey = `post:${postId}`
    const cached = await getCache<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Obtener post de la BD
    const [posts] = await pool.execute(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.upvotes,
        p.downvotes,
        p.comment_count,
        p.is_hot,
        p.is_pinned,
        p.created_at,
        s.id as subforum_id,
        s.name as subforum_name,
        s.slug as subforum_slug,
        u.id as author_id,
        u.username as author_username
      FROM posts p
      LEFT JOIN subforums s ON p.subforum_id = s.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [postId]) as any[]

    if (posts.length === 0) {
      return NextResponse.json(
        { message: 'Post no encontrado' },
        { status: 404 }
      )
    }

    const post = posts[0]

    // Formatear fecha
    const now = new Date()
    const diff = now.getTime() - new Date(post.created_at).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    let timeAgo = 'hace unos segundos'
    if (minutes >= 1 && minutes < 60) {
      timeAgo = `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    } else if (hours >= 1 && hours < 24) {
      timeAgo = `hace ${hours} hora${hours > 1 ? 's' : ''}`
    } else if (days >= 1) {
      timeAgo = `hace ${days} día${days > 1 ? 's' : ''}`
    }

    const result = {
      ...post,
      timeAgo,
      isNew: hours < 24,
    }

    // NO guardar en cache - posts individuales no se cachean para ahorrar comandos
    // El contenido completo con imágenes es muy grande y se carga rápido desde MySQL

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { message: 'Error al obtener el post' },
      { status: 500 }
    )
  }
}

