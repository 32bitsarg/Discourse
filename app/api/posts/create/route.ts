import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateKeys } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para crear un post' },
        { status: 401 }
      )
    }

    const { title, content, subforumId } = await request.json()

    if (!content || !subforumId) {
      return NextResponse.json(
        { message: 'Contenido y comunidad son requeridos' },
        { status: 400 }
      )
    }

    // Si no hay título, usar las primeras palabras del contenido
    const finalTitle = title?.trim() || content.trim().substring(0, 100).replace(/\n/g, ' ').trim() || 'Sin título'

    // Verificar que el subforum existe
    const [subforums] = await pool.execute(
      'SELECT id, name FROM subforums WHERE id = ?',
      [subforumId]
    ) as any[]

    if (subforums.length === 0) {
      return NextResponse.json(
        { message: 'La comunidad no existe' },
        { status: 404 }
      )
    }

    // Crear el post
    const [result] = await pool.execute(
      'INSERT INTO posts (subforum_id, author_id, title, content) VALUES (?, ?, ?, ?)',
      [subforumId, user.id, finalTitle, content]
    ) as any

    // Actualizar contador de posts en el subforum
    await pool.execute(
      'UPDATE subforums SET post_count = post_count + 1 WHERE id = ?',
      [subforumId]
    )

        // Invalidar cache específico: stats y subforums (keys conocidas)
        // Nota: No invalidamos posts porque el TTL corto (45-60s) se encarga
        // y Upstash no soporta invalidación por patrón eficientemente
        await invalidateKeys([
          'stats:global',
          'subforums:list',
          `user:${user.id}:subforum_ids`
        ])

    return NextResponse.json({
      message: 'Post creado exitosamente',
      post: {
        id: result.insertId,
        title,
        content,
        subforumId,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al crear el post' },
      { status: 500 }
    )
  }
}

