import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateCache } from '@/lib/redis'

// PUT - Editar comentario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para editar comentarios' },
        { status: 401 }
      )
    }

    const { id } = await params
    const commentId = parseInt(id)
    const { content } = await request.json()

    if (isNaN(commentId)) {
      return NextResponse.json(
        { message: 'ID de comentario inválido' },
        { status: 400 }
      )
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { message: 'El contenido del comentario es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el comentario existe y pertenece al usuario
    const [comments] = await pool.execute(
      'SELECT id, author_id, post_id FROM comments WHERE id = ?',
      [commentId]
    ) as any[]

    if (comments.length === 0) {
      return NextResponse.json(
        { message: 'Comentario no encontrado' },
        { status: 404 }
      )
    }

    if (comments[0].author_id !== user.id) {
      return NextResponse.json(
        { message: 'No tienes permiso para editar este comentario' },
        { status: 403 }
      )
    }

    // Actualizar comentario y marcar como editado
    await pool.execute(
      'UPDATE comments SET content = ?, edited_at = NOW() WHERE id = ?',
      [content.trim(), commentId]
    )

    // Invalidar cache del post
    await invalidateCache(`post:${comments[0].post_id}`)

    return NextResponse.json({ message: 'Comentario actualizado exitosamente' })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al actualizar el comentario' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar comentario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para eliminar comentarios' },
        { status: 401 }
      )
    }

    const { id } = await params
    const commentId = parseInt(id)

    if (isNaN(commentId)) {
      return NextResponse.json(
        { message: 'ID de comentario inválido' },
        { status: 400 }
      )
    }

    // Verificar que el comentario existe y pertenece al usuario
    const [comments] = await pool.execute(
      'SELECT id, author_id, post_id FROM comments WHERE id = ?',
      [commentId]
    ) as any[]

    if (comments.length === 0) {
      return NextResponse.json(
        { message: 'Comentario no encontrado' },
        { status: 404 }
      )
    }

    if (comments[0].author_id !== user.id) {
      return NextResponse.json(
        { message: 'No tienes permiso para eliminar este comentario' },
        { status: 403 }
      )
    }

    const postId = comments[0].post_id

    // Eliminar comentario
    await pool.execute('DELETE FROM comments WHERE id = ?', [commentId])

    // Actualizar contador de comentarios en el post
    await pool.execute(
      'UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = ?',
      [postId]
    )

    // Invalidar cache del post
    await invalidateCache(`post:${postId}`)

    return NextResponse.json({ message: 'Comentario eliminado exitosamente' })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al eliminar el comentario' },
      { status: 500 }
    )
  }
}

