import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getConnection } from '@/lib/db'

// POST - Compartir un post a una plataforma externa
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, platform, message } = body

    if (!post_id || !platform) {
      return NextResponse.json(
        { error: 'post_id and platform are required' },
        { status: 400 }
      )
    }

    const connection = await getConnection()

    // Verificar que el post existe
    const [posts] = await connection.execute(
      'SELECT id, title, content, author_id FROM posts WHERE id = ?',
      [post_id]
    )

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const post = posts[0] as any

    // Verificar que el usuario tiene una conexión activa con la plataforma
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

    // Intentar compartir en la plataforma externa
    let shareResult: { success: boolean; platform_post_id?: string; share_url?: string; error?: string } = { success: false }

    try {
      shareResult = await shareToPlatform(
        platform.toLowerCase(),
        platformConnection.access_token,
        {
          title: post.title,
          content: post.content,
          message: message || '',
          post_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/post/${post_id}`
        }
      )
    } catch (error: any) {
      console.error('Error sharing to platform:', error)
      shareResult = {
        success: false,
        error: error.message || 'Failed to share to platform'
      }
    }

    // Guardar el registro del share solo si fue exitoso
    if (shareResult.success) {
      const [result] = await connection.execute(
        `INSERT INTO post_shares 
         (post_id, user_id, platform, platform_post_id, share_url, status)
         VALUES (?, ?, ?, ?, ?, 'success')`,
        [
          post_id,
          user.id,
          platform.toLowerCase(),
          shareResult.platform_post_id || null,
          shareResult.share_url || null
        ]
      )

      const insertResult = result as any

      return NextResponse.json({
        success: true,
        share_id: insertResult.insertId,
        share_url: shareResult.share_url,
        platform_post_id: shareResult.platform_post_id
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: shareResult.error || 'Failed to share'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error sharing post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Función helper para compartir a diferentes plataformas
async function shareToPlatform(
  platform: string,
  accessToken: string,
  content: { title: string; content: string; message: string; post_url: string }
): Promise<{ success: boolean; platform_post_id?: string; share_url?: string; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const fullText = `${content.message}\n\n${content.title}\n\n${content.post_url}`

  switch (platform) {
    case 'twitter':
      return await shareToTwitter(accessToken, fullText)
    // Próximamente: Facebook, LinkedIn, Instagram
    default:
      return {
        success: false,
        error: 'Unsupported platform'
      }
  }
}

// Compartir a Twitter/X
async function shareToTwitter(
  accessToken: string,
  text: string
): Promise<{ success: boolean; platform_post_id?: string; share_url?: string; error?: string }> {
  try {
    // Twitter API v2
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.substring(0, 280) // Límite de caracteres de Twitter
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.detail || 'Failed to post to Twitter'
      }
    }

    const data = await response.json()
    return {
      success: true,
      platform_post_id: data.data?.id,
      share_url: `https://twitter.com/i/web/status/${data.data?.id}`
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Twitter API error'
    }
  }
}

// Próximamente: Funciones para Facebook, LinkedIn, etc.

