import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateCache } from '@/lib/redis'
import {
  getMaxCommentLength,
  containsBannedWords,
  getMinKarmaToComment,
  areExternalLinksAllowed,
} from '@/lib/settings-validation'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { loadAllCommentsOptimized } from '@/lib/optimized-comments-loader'
import { createNotification } from '@/lib/notifications'
import { isUserBanned } from '@/lib/moderation'

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

    // Obtener usuario actual para verificar permisos de edición/eliminación
    const currentUser = await getCurrentUser()
    const currentUserId = currentUser?.id || null

    // Cargar TODOS los comentarios de forma optimizada (una sola query)
    const formattedComments = await loadAllCommentsOptimized(postId, currentUserId, 5)

          // Caché HTTP para comentarios (ahora sin imágenes base64)
          return NextResponse.json({ comments: formattedComments }, {
            headers: {
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
              'CDN-Cache-Control': 'public, s-maxage=120',
              'Vercel-CDN-Cache-Control': 'public, s-maxage=120',
            },
          })
  } catch (error) {
    console.error('Error al obtener comentarios:', error)
    return NextResponse.json(
      { message: 'Error al obtener los comentarios' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar rate limit
    const rateLimit = await checkRateLimit(request, 'create_comment')
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
        { message: 'Debes iniciar sesión para comentar' },
        { status: 401 }
      )
    }

    // Verificar si el usuario está baneado
    const banned = await isUserBanned(user.id)
    if (banned) {
      return NextResponse.json(
        { message: 'Tu cuenta ha sido suspendida. No puedes comentar.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const postId = parseInt(id)
    const { content, parentId } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json(
        { message: 'El contenido del comentario es requerido' },
        { status: 400 }
      )
    }

    // Validar longitud máxima del comentario
    const { getMaxCommentLength, containsBannedWords, getMinKarmaToComment } = await import('@/lib/settings-validation')
    const maxLength = await getMaxCommentLength()
    if (content.length > maxLength) {
      return NextResponse.json(
        { message: `El comentario no puede exceder ${maxLength} caracteres` },
        { status: 400 }
      )
    }

    // Validar karma mínimo para comentar
    const minKarma = await getMinKarmaToComment()
    if (user.karma < minKarma) {
      return NextResponse.json(
        { message: `Necesitas al menos ${minKarma} karma para comentar` },
        { status: 403 }
      )
    }

    // Validar palabras prohibidas
    const hasBannedWords = await containsBannedWords(content)
    if (hasBannedWords) {
      return NextResponse.json(
        { message: 'El contenido contiene palabras no permitidas' },
        { status: 400 }
      )
    }

    // Validar enlaces externos
    const linksAllowed = await areExternalLinksAllowed()
    if (!linksAllowed) {
      const urlRegex = /(https?:\/\/[^\s]+)/g
      if (urlRegex.test(content)) {
        return NextResponse.json(
          { message: 'Los enlaces externos no están permitidos en los comentarios' },
          { status: 400 }
        )
      }
    }

    if (isNaN(postId)) {
      return NextResponse.json(
        { message: 'ID de post inválido' },
        { status: 400 }
      )
    }

    // Verificar que el post existe y obtener información para notificaciones
    const [postData] = await pool.execute(
      'SELECT id, author_id, title FROM posts WHERE id = ?',
      [postId]
    ) as any[]
    if (postData.length === 0) {
      return NextResponse.json(
        { message: 'Post no encontrado' },
        { status: 404 }
      )
    }
    const post = postData[0]

    // Crear comentario
    const [result] = await pool.execute(
      'INSERT INTO comments (post_id, author_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [postId, user.id, content.trim(), parentId || null]
    ) as any

    // Actualizar contador de comentarios en el post
    await pool.execute(
      'UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?',
      [postId]
    )

    // Crear notificaciones
    if (parentId) {
      // Es una respuesta a un comentario - notificar al autor del comentario padre
      const [parentComments] = await pool.execute(
        'SELECT author_id FROM comments WHERE id = ?',
        [parentId]
      ) as any[]
      if (parentComments.length > 0 && parentComments[0].author_id !== user.id) {
        await createNotification({
          userId: parentComments[0].author_id,
          type: 'comment_reply',
          content: `${user.username} respondió a tu comentario`,
          relatedPostId: postId,
          relatedCommentId: result.insertId,
          relatedUserId: user.id,
        })
      }
    } else {
      // Es un comentario nuevo - notificar al autor del post (si no es el mismo usuario)
      if (post && post.author_id !== user.id) {
        await createNotification({
          userId: post.author_id,
          type: 'reply',
          content: `${user.username} comentó en tu post "${post.title}"`,
          relatedPostId: postId,
          relatedCommentId: result.insertId,
          relatedUserId: user.id,
        })
      }
    }

    // Invalidar cache
    await invalidateCache(`post:${postId}`)
    await invalidateCache('posts:*')

    return NextResponse.json({
      message: 'Comentario creado exitosamente',
      comment: {
        id: result.insertId,
        content: content.trim(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al crear el comentario' },
      { status: 500 }
    )
  }
}

