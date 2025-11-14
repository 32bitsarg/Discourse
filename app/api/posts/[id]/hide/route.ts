import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'

/**
 * POST - Ocultar/mostrar un post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    const { id } = await params
    const postId = parseInt(id)

    if (isNaN(postId)) {
      return NextResponse.json(
        { message: 'ID de post inválido' },
        { status: 400 }
      )
    }

    // Verificar si ya está oculto
    const [existing] = await pool.execute(
      'SELECT id FROM hidden_posts WHERE user_id = ? AND post_id = ?',
      [user.id, postId]
    ) as any[]

    if (existing.length > 0) {
      // Mostrar
      await pool.execute(
        'DELETE FROM hidden_posts WHERE id = ?',
        [existing[0].id]
      )
      return NextResponse.json({ message: 'Post mostrado', hidden: false })
    } else {
      // Ocultar
      await pool.execute(
        'INSERT INTO hidden_posts (user_id, post_id) VALUES (?, ?)',
        [user.id, postId]
      )
      return NextResponse.json({ message: 'Post oculto', hidden: true })
    }
  } catch (error) {
    console.error('Error ocultando post:', error)
    return NextResponse.json(
      { message: 'Error al ocultar el post' },
      { status: 500 }
    )
  }
}

