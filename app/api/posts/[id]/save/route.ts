import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'

/**
 * POST - Guardar/desguardar un post
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

    // Verificar si ya está guardado
    const [existing] = await pool.execute(
      'SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?',
      [user.id, postId]
    ) as any[]

    if (existing.length > 0) {
      // Desguardar
      await pool.execute(
        'DELETE FROM saved_posts WHERE id = ?',
        [existing[0].id]
      )
      return NextResponse.json({ message: 'Post desguardado', saved: false })
    } else {
      // Guardar
      await pool.execute(
        'INSERT INTO saved_posts (user_id, post_id) VALUES (?, ?)',
        [user.id, postId]
      )
      return NextResponse.json({ message: 'Post guardado', saved: true })
    }
  } catch (error) {
    console.error('Error guardando post:', error)
    return NextResponse.json(
      { message: 'Error al guardar el post' },
      { status: 500 }
    )
  }
}

/**
 * GET - Verificar si un post está guardado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ saved: false })
    }

    const { id } = await params
    const postId = parseInt(id)

    if (isNaN(postId)) {
      return NextResponse.json({ saved: false })
    }

    const [saved] = await pool.execute(
      'SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?',
      [user.id, postId]
    ) as any[]

    return NextResponse.json({ saved: saved.length > 0 })
  } catch (error) {
    return NextResponse.json({ saved: false })
  }
}

