import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCache, setCache } from '@/lib/redis'
import { getCurrentUser } from '@/lib/auth'
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

    // Intentar obtener del cache
    const cacheKey = `post:${postId}`
    const cached = await getCache<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Obtener usuario actual para verificar permisos de edición/eliminación
    const currentUser = await getCurrentUser()
    const currentUserId = currentUser?.id || null

    // Obtener post de la BD
    const [posts] = await pool.execute(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.upvotes,
        p.downvotes,
        p.comment_count,
        p.is_hot,
        p.is_pinned,
        p.created_at,
        p.edited_at,
        p.author_id,
        s.id as subforum_id,
        s.name as subforum_name,
        s.slug as subforum_slug,
        u.id as author_id,
        u.username as author_username
      FROM posts p
      LEFT JOIN subforums s ON p.subforum_id = s.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [postId]) as any[]

    if (posts.length === 0) {
      return NextResponse.json(
        { message: 'Post no encontrado' },
        { status: 404 }
      )
    }

    const post = posts[0]

    // Obtener el voto del usuario actual (si está logueado)
    let userVote: 'up' | 'down' | null = null
    if (currentUserId) {
      const [votes] = await pool.execute(
        'SELECT vote_type FROM votes WHERE user_id = ? AND post_id = ?',
        [currentUserId, postId]
      ) as any[]
      if (votes.length > 0) {
        userVote = votes[0].vote_type
      }
    }

    // Formatear fecha
    const now = new Date()
    const diff = now.getTime() - new Date(post.created_at).getTime()
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

    const result = {
      ...post,
      timeAgo,
      isNew: hours < 24,
      canEdit: currentUserId === post.author_id,
      canDelete: currentUserId === post.author_id,
      userVote, // Voto del usuario actual
    }

    // NO guardar en cache - posts individuales no se cachean para ahorrar comandos
    // El contenido completo con imágenes es muy grande y se carga rápido desde MySQL

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { message: 'Error al obtener el post' },
      { status: 500 }
    )
  }
}

// PUT - Editar post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para editar posts' },
        { status: 401 }
      )
    }

    const { id } = await params
    const postId = parseInt(id)
    const { title, content } = await request.json()

    if (isNaN(postId)) {
      return NextResponse.json(
        { message: 'ID de post inválido' },
        { status: 400 }
      )
    }

    if (!title || !title.trim() || !content || !content.trim()) {
      return NextResponse.json(
        { message: 'Título y contenido son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el post existe y pertenece al usuario
    const [posts] = await pool.execute(
      'SELECT id, author_id FROM posts WHERE id = ?',
      [postId]
    ) as any[]

    if (posts.length === 0) {
      return NextResponse.json(
        { message: 'Post no encontrado' },
        { status: 404 }
      )
    }

    if (posts[0].author_id !== user.id) {
      return NextResponse.json(
        { message: 'No tienes permiso para editar este post' },
        { status: 403 }
      )
    }

    // Actualizar post y marcar como editado
    await pool.execute(
      'UPDATE posts SET title = ?, content = ?, edited_at = NOW() WHERE id = ?',
      [title.trim(), content.trim(), postId]
    )

    return NextResponse.json({ message: 'Post actualizado exitosamente' })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json(
      { message: 'Error al actualizar el post' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para eliminar posts' },
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

    // Verificar que el post existe y pertenece al usuario
    const [posts] = await pool.execute(
      'SELECT id, author_id, subforum_id FROM posts WHERE id = ?',
      [postId]
    ) as any[]

    if (posts.length === 0) {
      return NextResponse.json(
        { message: 'Post no encontrado' },
        { status: 404 }
      )
    }

    if (posts[0].author_id !== user.id) {
      return NextResponse.json(
        { message: 'No tienes permiso para eliminar este post' },
        { status: 403 }
      )
    }

    const subforumId = posts[0].subforum_id

    // Eliminar post (CASCADE eliminará comentarios automáticamente)
    await pool.execute('DELETE FROM posts WHERE id = ?', [postId])

    // Decrementar contador de posts en el subforum
    await pool.execute(
      'UPDATE subforums SET post_count = GREATEST(post_count - 1, 0) WHERE id = ?',
      [subforumId]
    )

    // Invalidar cache de subforums y stats
    await invalidateCache('subforums:*')
    await invalidateCache('stats:*')
    await invalidateCache(`user:${user.id}:communities`)

    return NextResponse.json({ message: 'Post eliminado exitosamente' })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { message: 'Error al eliminar el post' },
      { status: 500 }
    )
  }
}

