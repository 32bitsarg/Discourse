import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getConnection } from '@/lib/db'

// GET - Obtener contenido importado del usuario
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const connection = await getConnection()
    
    let query = `
      SELECT 
        id,
        platform,
        platform_content_id,
        platform_content_url,
        post_id,
        content_type,
        title,
        content,
        media_urls,
        imported_at,
        last_synced_at,
        metadata
      FROM imported_content 
      WHERE user_id = ?
    `
    const queryParams: any[] = [user.id]

    if (platform) {
      query += ' AND platform = ?'
      queryParams.push(platform.toLowerCase())
    }

    query += ' ORDER BY imported_at DESC LIMIT ? OFFSET ?'
    queryParams.push(limit, offset)

    const [imported] = await connection.execute(query, queryParams)

    return NextResponse.json({
      content: Array.isArray(imported) ? imported.map((item: any) => ({
        ...item,
        media_urls: item.media_urls ? JSON.parse(item.media_urls) : [],
        metadata: item.metadata ? JSON.parse(item.metadata) : {}
      })) : []
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Importar contenido desde una plataforma externa
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { platform, create_post, subforum_id } = body

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      )
    }

    const connection = await getConnection()

    // Verificar que el usuario tiene una conexión activa
    const [connections] = await connection.execute(
      'SELECT access_token, platform_username FROM user_platform_connections WHERE user_id = ? AND platform = ? AND is_active = TRUE',
      [user.id, platform.toLowerCase()]
    )

    if (!Array.isArray(connections) || connections.length === 0) {
      return NextResponse.json(
        { error: 'Platform not connected or inactive' },
        { status: 400 }
      )
    }

    const platformConnection = connections[0] as any

    // Importar contenido desde la plataforma
    const importedContent = await importFromPlatform(
      platform.toLowerCase(),
      platformConnection.access_token,
      user.id
    )

    if (!importedContent || importedContent.length === 0) {
      return NextResponse.json(
        { error: 'No content found to import' },
        { status: 404 }
      )
    }

    const results = []

    for (const content of importedContent) {
      // Verificar si ya existe
      const [existing] = await connection.execute(
        'SELECT id FROM imported_content WHERE platform = ? AND platform_content_id = ?',
        [platform.toLowerCase(), content.platform_content_id]
      )

      if (Array.isArray(existing) && existing.length > 0) {
        // Actualizar contenido existente
        await connection.execute(
          `UPDATE imported_content 
           SET title = ?,
               content = ?,
               media_urls = ?,
               metadata = ?,
               last_synced_at = NOW()
           WHERE platform = ? AND platform_content_id = ?`,
          [
            content.title,
            content.content,
            JSON.stringify(content.media_urls || []),
            JSON.stringify(content.metadata || {}),
            platform.toLowerCase(),
            content.platform_content_id
          ]
        )
        results.push({ ...content, imported: false, updated: true })
      } else {
        // Crear nuevo registro de contenido importado
        let postId = null

        // Si se solicita crear un post, crearlo
        if (create_post && subforum_id) {
          const [postResult] = await connection.execute(
            `INSERT INTO posts (subforum_id, author_id, title, content, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [
              subforum_id,
              user.id,
              content.title || 'Imported Content',
              content.content || ''
            ]
          )
          const insertResult = postResult as any
          postId = insertResult.insertId

          // Actualizar contador de posts
          await connection.execute(
            'UPDATE subforums SET post_count = post_count + 1 WHERE id = ?',
            [subforum_id]
          )
        }

        await connection.execute(
          `INSERT INTO imported_content 
           (user_id, platform, platform_content_id, platform_content_url, post_id, content_type, title, content, media_urls, metadata)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            platform.toLowerCase(),
            content.platform_content_id,
            content.platform_content_url,
            postId,
            content.content_type,
            content.title,
            content.content,
            JSON.stringify(content.media_urls || []),
            JSON.stringify(content.metadata || {})
          ]
        )
        results.push({ ...content, imported: true, updated: false, post_id: postId })
      }
    }

    // Actualizar last_sync_at en la conexión
    await connection.execute(
      'UPDATE user_platform_connections SET last_sync_at = NOW() WHERE user_id = ? AND platform = ?',
      [user.id, platform.toLowerCase()]
    )

    return NextResponse.json({
      success: true,
      imported: results.filter(r => r.imported).length,
      updated: results.filter(r => r.updated === true).length,
      content: results
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Función helper para importar desde diferentes plataformas
async function importFromPlatform(
  platform: string,
  accessToken: string,
  userId: number
): Promise<Array<{
  platform_content_id: string
  platform_content_url: string
  content_type: string
  title?: string
  content: string
  media_urls?: string[]
  metadata?: any
}>> {
  switch (platform) {
    case 'twitter':
      return await importFromTwitter(accessToken)
    case 'instagram':
      return await importFromInstagram(accessToken)
    case 'facebook':
      return await importFromFacebook(accessToken)
    default:
      return []
  }
}

// Importar desde Twitter usando API v1.1 (gratuita)
async function importFromTwitter(accessToken: string): Promise<Array<any>> {
  try {
    // API v1.1 - OAuth 2.0 Bearer token funciona con algunos endpoints v1.1
    // Nota: Para obtener tweets del usuario necesitamos OAuth 1.0a o usar user_timeline
    // Por ahora, retornamos array vacío ya que la importación de contenido no es crítica
    return []
  } catch (error: any) {
    return []
  }
}

// Importar desde Instagram
async function importFromInstagram(accessToken: string): Promise<Array<any>> {
  try {
    // Instagram Basic Display API
    const response = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${accessToken}&limit=10`)

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    if (!data.data) return []

    return data.data.map((item: any) => ({
      platform_content_id: item.id,
      platform_content_url: item.permalink,
      content_type: item.media_type === 'VIDEO' ? 'video' : 'image',
      title: item.caption ? item.caption.substring(0, 100) : 'Instagram Post',
      content: item.caption || '',
      media_urls: [item.media_url],
      metadata: {
        media_type: item.media_type,
        timestamp: item.timestamp,
        platform: 'instagram'
      }
    }))
  } catch (error: any) {
    return []
  }
}

// Importar desde Facebook
async function importFromFacebook(accessToken: string): Promise<Array<any>> {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/me/posts?fields=id,message,created_time,permalink_url&access_token=${accessToken}&limit=10`)

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    if (!data.data) return []

    return data.data.map((post: any) => ({
      platform_content_id: post.id,
      platform_content_url: post.permalink_url,
      content_type: 'post',
      title: post.message ? post.message.substring(0, 100) : 'Facebook Post',
      content: post.message || '',
      metadata: {
        created_time: post.created_time,
        platform: 'facebook'
      }
    }))
  } catch (error: any) {
    return []
  }
}

