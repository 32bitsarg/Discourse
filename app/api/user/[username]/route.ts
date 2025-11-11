import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    // Obtener información del usuario
    const [users] = await pool.execute(
      'SELECT id, username, email, avatar_url, bio, banner_url, website, location, theme_color, karma, created_at FROM users WHERE username = ?',
      [username]
    ) as any[]

    if (users.length === 0) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const user = users[0]

    // Obtener links sociales
    const [socialLinks] = await pool.execute(
      'SELECT id, platform, url FROM user_social_links WHERE user_id = ? ORDER BY platform',
      [user.id]
    ) as any[]

    // Obtener proyectos
    const [projects] = await pool.execute(
      'SELECT id, title, description, image_url, project_url, category FROM user_projects WHERE user_id = ? ORDER BY display_order, created_at DESC',
      [user.id]
    ) as any[]

    // Obtener contadores de follows
    const [followers] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?',
      [user.id]
    ) as any[]
    const [following] = await pool.execute(
      'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?',
      [user.id]
    ) as any[]

    // Obtener posts del usuario
    const [posts] = await pool.execute(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.upvotes,
        p.downvotes,
        p.comment_count,
        p.created_at,
        s.name as subforum_name,
        s.slug as subforum_slug
      FROM posts p
      LEFT JOIN subforums s ON p.subforum_id = s.id
      WHERE p.author_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [user.id]) as any[]

    // Formatear fechas
    const formattedPosts = posts.map((post: any) => {
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

      return {
        ...post,
        timeAgo,
      }
    })

    return NextResponse.json({
      user: {
        ...user,
        socialLinks: Array.isArray(socialLinks) ? socialLinks : [],
        projects: Array.isArray(projects) ? projects : [],
        followers: Array.isArray(followers) && followers.length > 0 ? (followers[0] as any).count : 0,
        following: Array.isArray(following) && following.length > 0 ? (following[0] as any).count : 0,
      },
      posts: formattedPosts,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { message: 'Error al obtener el usuario' },
      { status: 500 }
    )
  }
}

