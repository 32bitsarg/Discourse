import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateCache } from '@/lib/redis'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para votar' },
        { status: 401 }
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

      // Actualizar contadores en el post
      if (voteType === 'up') {
        await pool.execute('UPDATE posts SET upvotes = upvotes + 1 WHERE id = ?', [postId])
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
    console.error('Vote error:', error)
    return NextResponse.json(
      { message: 'Error al registrar el voto' },
      { status: 500 }
    )
  }
}

