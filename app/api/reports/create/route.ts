import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Verificar rate limit
    const rateLimit = await checkRateLimit(request, 'create_report')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        createRateLimitResponse(rateLimit.remaining, rateLimit.resetAt, rateLimit.limit),
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimit.resetAt.toString(),
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          }
        }
      )
    }

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para reportar' },
        { status: 401 }
      )
    }

    const { postId, commentId, reason, description } = await request.json()

    // Validar que se reporte un post o un comentario, pero no ambos
    if (!postId && !commentId) {
      return NextResponse.json(
        { message: 'Debes especificar un post o un comentario para reportar' },
        { status: 400 }
      )
    }

    if (postId && commentId) {
      return NextResponse.json(
        { message: 'Solo puedes reportar un post o un comentario, no ambos' },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { message: 'Debes especificar una razón para el reporte' },
        { status: 400 }
      )
    }

    // Verificar que el post o comentario existe
    if (postId) {
      const [posts] = await pool.execute('SELECT id, author_id FROM posts WHERE id = ?', [postId]) as any[]
      if (posts.length === 0) {
        return NextResponse.json(
          { message: 'Post no encontrado' },
          { status: 404 }
        )
      }
      // No permitir reportar tu propio post
      if (posts[0].author_id === user.id) {
        return NextResponse.json(
          { message: 'No puedes reportar tu propio post' },
          { status: 400 }
        )
      }
    }

    if (commentId) {
      const [comments] = await pool.execute('SELECT id, author_id FROM comments WHERE id = ?', [commentId]) as any[]
      if (comments.length === 0) {
        return NextResponse.json(
          { message: 'Comentario no encontrado' },
          { status: 404 }
        )
      }
      // No permitir reportar tu propio comentario
      if (comments[0].author_id === user.id) {
        return NextResponse.json(
          { message: 'No puedes reportar tu propio comentario' },
          { status: 400 }
        )
      }
    }

    // Verificar si el usuario ya reportó este post/comentario
    const [existingReports] = await pool.execute(
      `SELECT id FROM reports 
       WHERE user_id = ? AND status = 'pending' 
       AND ((post_id = ? AND ? IS NOT NULL) OR (comment_id = ? AND ? IS NOT NULL))`,
      [user.id, postId || null, postId || null, commentId || null, commentId || null]
    ) as any[]

    if (existingReports.length > 0) {
      return NextResponse.json(
        { message: 'Ya has reportado este contenido. Espera a que sea revisado.' },
        { status: 400 }
      )
    }

    // Crear el reporte
    const [result] = await pool.execute(
      'INSERT INTO reports (user_id, post_id, comment_id, reason, description) VALUES (?, ?, ?, ?, ?)',
      [user.id, postId || null, commentId || null, reason.trim(), description?.trim() || null]
    ) as any

    return NextResponse.json({
      message: 'Reporte enviado exitosamente. Será revisado por los moderadores.',
      reportId: result.insertId,
    })
  } catch (error) {
    console.error('Error creando reporte:', error)
    return NextResponse.json(
      { message: 'Error al crear el reporte' },
      { status: 500 }
    )
  }
}

