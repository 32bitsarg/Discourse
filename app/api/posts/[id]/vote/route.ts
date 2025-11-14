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
    const postId = parseInt(id)
    const { voteType } = await request.json()

    if (isNaN(postId) || !voteType || !['up', 'down'].includes(voteType)) {
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
      'SELECT id, vote_type FROM votes WHERE user_id = ? AND post_id = ?',
      [user.id, postId]
    ) as any[]

    if (existingVotes.length > 0) {
      const existingVote = existingVotes[0]
      
      // Si es el mismo voto, eliminarlo (toggle)
      if (existingVote.vote_type === voteType) {
        await pool.execute('DELETE FROM votes WHERE id = ?', [existingVote.id])
        
        // Actualizar contadores en el post
        if (voteType === 'up') {
          await pool.execute('UPDATE posts SET upvotes = upvotes - 1 WHERE id = ?', [postId])
        } else {
          await pool.execute('UPDATE posts SET downvotes = downvotes - 1 WHERE id = ?', [postId])
        }

        // Invalidar cache
        await invalidateCache(`post:${postId}`)
        await invalidateCache('posts:*')

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
          await pool.execute('UPDATE posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?', [postId])
        } else {
          await pool.execute('UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?', [postId])
        }

        // Invalidar cache
        await invalidateCache(`post:${postId}`)
        await invalidateCache('posts:*')

        return NextResponse.json({
          message: 'Voto actualizado',
          voteType,
        })
      }
    } else {
      // Crear nuevo voto
      await pool.execute(
        'INSERT INTO votes (user_id, post_id, vote_type) VALUES (?, ?, ?)',
        [user.id, postId, voteType]
      )

      // Obtener información del post para notificaciones
      const [posts] = await pool.execute(
        'SELECT author_id, title FROM posts WHERE id = ?',
        [postId]
      ) as any[]
      const post = posts[0]

      // Actualizar contadores en el post
      if (voteType === 'up') {
        await pool.execute('UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?', [postId])
        
        // Notificar al autor del post (solo si es upvote y no es el mismo usuario)
        if (post && post.author_id !== user.id) {
          await createNotification({
            userId: post.author_id,
            type: 'upvote',
            content: `${user.username} votó positivamente tu post "${post.title}"`,
            relatedPostId: postId,
            relatedUserId: user.id,
          })
        }
      } else {
        await pool.execute('UPDATE posts SET downvotes = downvotes + 1 WHERE id = ?', [postId])
      }

      // Invalidar cache
      await invalidateCache(`post:${postId}`)
      await invalidateCache('posts:*')

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

