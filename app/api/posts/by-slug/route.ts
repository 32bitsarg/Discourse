import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const communitySlug = searchParams.get('community')
    const postSlug = searchParams.get('slug')

    if (!communitySlug || !postSlug) {
      return NextResponse.json(
        { message: 'Slug de comunidad y post son requeridos' },
        { status: 400 }
      )
    }

    const currentUser = await getCurrentUser()
    const currentUserId = currentUser?.id || null

    const [posts] = await pool.execute(`
      SELECT 
        p.id,
        p.title,
        p.slug,
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
      WHERE p.slug = ? AND s.slug = ?
    `, [postSlug, communitySlug]) as any[]

    if (posts.length === 0) {
      return NextResponse.json(
        { message: 'Post no encontrado' },
        { status: 404 }
      )
    }

    const post = posts[0]

    let userVote: 'up' | 'down' | null = null
    if (currentUserId) {
      const [votes] = await pool.execute(
        'SELECT vote_type FROM votes WHERE user_id = ? AND post_id = ?',
        [currentUserId, post.id]
      ) as any[]
      if (votes.length > 0) {
        userVote = votes[0].vote_type
      }
    }

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
      userVote,
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al obtener el post' },
      { status: 500 }
    )
  }
}

