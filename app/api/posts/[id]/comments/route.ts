import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateCache } from '@/lib/redis'

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

    // Obtener comentarios (solo comentarios principales, sin replies por ahora)
    const [comments] = await pool.execute(`
      SELECT 
        c.id,
        c.content,
        c.upvotes,
        c.downvotes,
        c.created_at,
        c.edited_at,
        c.author_id,
        u.username as author_username
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ? AND (c.parent_id IS NULL OR c.parent_id = 0)
      ORDER BY c.created_at DESC
    `, [postId]) as any[]

    console.log(`[API] Comentarios encontrados para post ${postId}:`, comments.length)

    // Formatear fechas
    const formattedComments = (comments || []).map((comment: any) => {
      const now = new Date()
      const createdAt = new Date(comment.created_at)
      const diff = now.getTime() - createdAt.getTime()
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

      return {
        id: comment.id,
        content: comment.content,
        author_username: comment.author_username || 'Usuario desconocido',
        author_id: comment.author_id,
        upvotes: comment.upvotes || 0,
        downvotes: comment.downvotes || 0,
        created_at: comment.created_at,
        edited_at: comment.edited_at,
        timeAgo,
        canEdit: currentUserId === comment.author_id,
        canDelete: currentUserId === comment.author_id,
        replies: [], // Por ahora sin replies
      }
    })

    console.log(`[API] Comentarios formateados:`, formattedComments.length)

    return NextResponse.json({ comments: formattedComments })
  } catch (error) {
    console.error('Get comments error:', error)
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
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para comentar' },
        { status: 401 }
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

    if (isNaN(postId)) {
      return NextResponse.json(
        { message: 'ID de post inválido' },
        { status: 400 }
      )
    }

    // Verificar que el post existe
    const [posts] = await pool.execute('SELECT id FROM posts WHERE id = ?', [postId]) as any[]
    if (posts.length === 0) {
      return NextResponse.json(
        { message: 'Post no encontrado' },
        { status: 404 }
      )
    }

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
    console.error('Create comment error:', error)
    return NextResponse.json(
      { message: 'Error al crear el comentario' },
      { status: 500 }
    )
  }
}

