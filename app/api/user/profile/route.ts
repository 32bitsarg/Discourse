import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getConnection } from '@/lib/db'

// GET - Obtener perfil del usuario actual
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connection = await getConnection()
    
    // Obtener datos completos del usuario
    const [users] = await connection.execute(
      'SELECT id, username, email, avatar_url, bio, banner_url, website, location, theme_color, karma, created_at FROM users WHERE id = ?',
      [user.id]
    )

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = users[0] as any

    // Obtener links sociales
    const [socialLinks] = await connection.execute(
      'SELECT id, platform, url FROM user_social_links WHERE user_id = ? ORDER BY platform',
      [user.id]
    )

    // Obtener proyectos
    const [projects] = await connection.execute(
      'SELECT id, title, description, image_url, project_url, category, display_order FROM user_projects WHERE user_id = ? ORDER BY display_order, created_at DESC',
      [user.id]
    )

    // Obtener estadísticas
    const [stats] = await connection.execute(
      `SELECT 
        (SELECT COUNT(*) FROM posts WHERE author_id = ?) as post_count,
        (SELECT COUNT(*) FROM comments WHERE author_id = ?) as comment_count,
        (SELECT COUNT(*) FROM subforums WHERE creator_id = ?) as communities_created,
        (SELECT COUNT(*) FROM subforum_members WHERE user_id = ? AND role IN ('admin', 'moderator')) as communities_moderated
      `,
      [user.id, user.id, user.id, user.id]
    )

    const statsData = Array.isArray(stats) && stats.length > 0 ? stats[0] : {}

    // Obtener contadores de follows
    const [followers] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?',
      [user.id]
    ) as any[]
    const [following] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?',
      [user.id]
    ) as any[]

    return NextResponse.json(
      {
        user: {
          ...userData,
          socialLinks: Array.isArray(socialLinks) ? socialLinks : [],
          projects: Array.isArray(projects) ? projects : [],
          stats: {
            ...statsData,
            followers: Array.isArray(followers) && followers.length > 0 ? (followers[0] as any).count : 0,
            following: Array.isArray(following) && following.length > 0 ? (following[0] as any).count : 0,
          }
        }
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'CDN-Cache-Control': 'public, s-maxage=600',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar perfil del usuario actual
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bio, banner_url, website, location, theme_color, socialLinks, projects } = body

    const connection = await getConnection()

    // Actualizar campos básicos del usuario
    const updateFields: string[] = []
    const updateValues: any[] = []

    if (bio !== undefined) {
      updateFields.push('bio = ?')
      updateValues.push(bio)
    }
    if (banner_url !== undefined) {
      updateFields.push('banner_url = ?')
      updateValues.push(banner_url)
    }
    if (website !== undefined) {
      updateFields.push('website = ?')
      updateValues.push(website)
    }
    if (location !== undefined) {
      updateFields.push('location = ?')
      updateValues.push(location)
    }
    if (theme_color !== undefined) {
      updateFields.push('theme_color = ?')
      updateValues.push(theme_color)
    }

    if (updateFields.length > 0) {
      updateValues.push(user.id)
      await connection.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      )
    }

    // Actualizar links sociales si se proporcionan
    if (Array.isArray(socialLinks)) {
      // Eliminar links existentes
      await connection.execute(
        'DELETE FROM user_social_links WHERE user_id = ?',
        [user.id]
      )

      // Insertar nuevos links
      if (socialLinks.length > 0) {
        const values = socialLinks.map((link: any) => [user.id, link.platform, link.url])
        const placeholders = values.map(() => '(?, ?, ?)').join(', ')
        const flatValues = values.flat()
        
        await connection.execute(
          `INSERT INTO user_social_links (user_id, platform, url) VALUES ${placeholders}`,
          flatValues
        )
      }
    }

    // Actualizar proyectos si se proporcionan
    if (Array.isArray(projects)) {
      // Eliminar proyectos existentes
      await connection.execute(
        'DELETE FROM user_projects WHERE user_id = ?',
        [user.id]
      )

      // Insertar nuevos proyectos
      if (projects.length > 0) {
        for (const project of projects) {
          await connection.execute(
            'INSERT INTO user_projects (user_id, title, description, image_url, project_url, category, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              user.id,
              project.title,
              project.description || null,
              project.image_url || null,
              project.project_url || null,
              project.category || null,
              project.display_order || 0
            ]
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

