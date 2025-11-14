import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateCache } from '@/lib/redis'
import {
  areDownvotesAllowed,
  getMinKarmaToVote,
} from '@/lib/settings-validation'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { createNotification } from '@/lib/notifications'
import { isUserBanned } from '@/lib/moderation'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar rate limit
    const rateLimit = await checkRateLimit(request, 'vote')
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
        { message: 'Debes iniciar sesión para votar' },
        { status: 401 }
      )
    }

    // Verificar si el usuario está baneado
    const banned = await isUserBanned(user.id)
    if (banned) {
      return NextResponse.json(
        { message: 'Tu cuenta ha sido suspendida. No puedes votar.' },
        { status: 403 }
      )
    }

    const { id } = await params
    const commentId = parseInt(id)
    const { voteType } = await request.json()

    if (isNaN(commentId) || !voteType || !['up', 'down'].includes(voteType)) {
      return NextResponse.json(
        { message: 'Datos inválidos' },
        { status: 400 }
      )
    }

    // Validar karma mínimo para votar
    const minKarma = await getMinKarmaToVote()
    if (user.karma < minKarma) {
      return NextResponse.json(
        { message: `Necesitas al menos ${minKarma} karma para votar` },
        { status: 403 }
      )
    }

    // Validar si downvotes están permitidos
    if (voteType === 'down') {
      const downvotesAllowed = await areDownvotesAllowed()
      if (!downvotesAllowed) {
        return NextResponse.json(
          { message: 'Los downvotes están deshabilitados' },
          { status: 403 }
        )
      }
    }

    // Verificar si ya existe un voto
    const [existingVotes] = await pool.execute(
      'SELECT id, vote_type FROM votes WHERE user_id = ? AND comment_id = ?',
      [user.id, commentId]
    ) as any[]

    if (existingVotes.length > 0) {
      const existingVote = existingVotes[0]
      
      // Si es el mismo voto, eliminarlo (toggle)
      if (existingVote.vote_type === voteType) {
        await pool.execute('DELETE FROM votes WHERE id = ?', [existingVote.id])
        
        // Actualizar contadores en el comentario
        if (voteType === 'up') {
          await pool.execute('UPDATE comments SET upvotes = upvotes - 1 WHERE id = ?', [commentId])
        } else {
          await pool.execute('UPDATE comments SET downvotes = downvotes - 1 WHERE id = ?', [commentId])
        }

        // Invalidar cache
        await invalidateCache(`comment:${commentId}`)
        await invalidateCache('comments:*')

        return NextResponse.json({
          message: 'Voto eliminado',
          voteType: null,
        })
      } else {
        // Cambiar el voto
        await pool.execute(
          'UPDATE votes SET vote_type = ? WHERE id = ?',
          [voteType, existingVote.id]
        )

        // Actualizar contadores
        if (existingVote.vote_type === 'up') {
          await pool.execute('UPDATE comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?', [commentId])
        } else {
          await pool.execute('UPDATE comments SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?', [commentId])
        }

        // Invalidar cache
        await invalidateCache(`comment:${commentId}`)
        await invalidateCache('comments:*')

        return NextResponse.json({
          message: 'Voto actualizado',
          voteType,
        })
      }
    } else {
      // Crear nuevo voto
      await pool.execute(
        'INSERT INTO votes (user_id, comment_id, vote_type) VALUES (?, ?, ?)',
        [user.id, commentId, voteType]
      )

      // Obtener información del comentario para notificaciones
      const [comments] = await pool.execute(
        'SELECT author_id, post_id, content FROM comments WHERE id = ?',
        [commentId]
      ) as any[]
      const comment = comments[0]

      // Actualizar contadores en el comentario
      if (voteType === 'up') {
        await pool.execute('UPDATE comments SET upvotes = upvotes + 1 WHERE id = ?', [commentId])
        
        // Notificar al autor del comentario (solo si es upvote y no es el mismo usuario)
        if (comment && comment.author_id !== user.id) {
          const contentPreview = comment.content.length > 50 
            ? comment.content.substring(0, 50) + '...' 
            : comment.content
          await createNotification({
            userId: comment.author_id,
            type: 'comment_upvote',
            content: `${user.username} votó positivamente tu comentario: "${contentPreview}"`,
            relatedPostId: comment.post_id,
            relatedCommentId: commentId,
            relatedUserId: user.id,
          })
        }
      } else {
        await pool.execute('UPDATE comments SET downvotes = downvotes + 1 WHERE id = ?', [commentId])
      }

      // Invalidar cache
      await invalidateCache(`comment:${commentId}`)
      await invalidateCache('comments:*')

      return NextResponse.json({
        message: 'Voto registrado',
        voteType,
      })
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al registrar el voto' },
      { status: 500 }
    )
  }
}

