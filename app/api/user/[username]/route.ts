import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    // Obtener usuario actual para verificar permisos de edición/eliminación
    const currentUser = await getCurrentUser()
    const currentUserId = currentUser?.id || null

    // OPTIMIZACIÓN: Una sola consulta con JOINs para reducir llamadas a la BD
    // Obtener información del usuario con contadores de follows en una sola query
    const [users] = await pool.execute(
      `SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.avatar_url, 
        u.bio, 
        u.banner_url, 
        u.website, 
        u.location, 
        u.theme_color, 
        u.karma, 
        u.created_at,
        (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count,
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id) as following_count
      FROM users u 
      WHERE u.username = ?`,
      [username]
    ) as any[]

    if (users.length === 0) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const user = users[0]

    // Obtener links sociales y proyectos en paralelo (más eficiente)
    const [socialLinksResult, projectsResult, postsResult] = await Promise.all([
      pool.execute(
        'SELECT id, platform, url FROM user_social_links WHERE user_id = ? ORDER BY platform',
        [user.id]
      ) as Promise<any[]>,
      pool.execute(
        'SELECT id, title, description, image_url, project_url, category FROM user_projects WHERE user_id = ? ORDER BY display_order, created_at DESC',
        [user.id]
      ) as Promise<any[]>,
      pool.execute(`
        SELECT 
          p.id,
          p.title,
          SUBSTRING(p.content, 1, 200) as content_preview,
          p.upvotes,
          p.downvotes,
          p.comment_count,
          p.created_at,
          p.author_id,
          s.name as subforum_name,
          s.slug as subforum_slug
        FROM posts p
        LEFT JOIN subforums s ON p.subforum_id = s.id
        WHERE p.author_id = ?
        ORDER BY p.created_at DESC
        LIMIT 20
      `, [user.id]) as Promise<any[]>
    ])
    
    const socialLinks = socialLinksResult[0] as any[]
    const projects = projectsResult[0] as any[]
    const posts = postsResult[0] as any[]

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
        canEdit: currentUserId === post.author_id, // El usuario puede editar si es el autor
        canDelete: currentUserId === post.author_id, // El usuario puede eliminar si es el autor
      }
    })

    // Caché HTTP para perfiles de usuario
    return NextResponse.json({
      user: {
        ...user,
        socialLinks: Array.isArray(socialLinks) ? socialLinks : [],
        projects: Array.isArray(projects) ? projects : [],
        followers: user.followers_count || 0,
        following: user.following_count || 0,
      },
      posts: formattedPosts,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al obtener el usuario' },
      { status: 500 }
    )
  }
}

