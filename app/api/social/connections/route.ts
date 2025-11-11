import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getConnection } from '@/lib/db'

// Función helper para importar avatar y banner del perfil
async function importProfileMedia(userId: number, accessToken: string, platform: string) {
  const connection = await getConnection()
  
  try {
    let avatarUrl: string | null = null
    let bannerUrl: string | null = null

    switch (platform) {
      case 'twitter':
        // Usar API v1.1 (gratuita) en lugar de v2
        const twitterV1Res = await fetch('https://api.twitter.com/1.1/account/verify_credentials.json?include_entities=false&skip_status=true', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        if (twitterV1Res.ok) {
          const twitterData = await twitterV1Res.json()
          avatarUrl = twitterData.profile_image_url_https?.replace('_normal', '_400x400') || null
          bannerUrl = twitterData.profile_banner_url || null
        }
        break

      // Próximamente: Facebook, Instagram, LinkedIn
      default:
        // Por ahora solo soportamos Twitter
        break
    }

    // Actualizar avatar y banner del usuario si se obtuvieron
    if (avatarUrl || bannerUrl) {
      const updateFields: string[] = []
      const updateValues: any[] = []

      if (avatarUrl) {
        updateFields.push('avatar_url = ?')
        updateValues.push(avatarUrl)
      }
      if (bannerUrl) {
        updateFields.push('banner_url = ?')
        updateValues.push(bannerUrl)
      }

      if (updateFields.length > 0) {
        updateValues.push(userId)
        await connection.execute(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        )
      }
    }
  } catch (error) {
    console.error('Error importing profile media:', error)
    throw error
  }
}

// GET - Obtener todas las conexiones del usuario
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connection = await getConnection()
    const [connections] = await connection.execute(
      `SELECT 
        id,
        platform,
        platform_username,
        is_active,
        created_at
      FROM user_platform_connections 
      WHERE user_id = ? AND is_active = TRUE
      ORDER BY created_at DESC`,
      [user.id]
    )

    return NextResponse.json({
      connections: Array.isArray(connections) ? connections : []
    })
  } catch (error: any) {
    console.error('Error fetching connections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Conectar una nueva plataforma
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      platform, 
      platform_user_id, 
      platform_username, 
      access_token, 
      refresh_token,
      token_expires_at,
      metadata 
    } = body

    if (!platform || !access_token) {
      return NextResponse.json(
        { error: 'Platform and access_token are required' },
        { status: 400 }
      )
    }

    const validPlatforms = ['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok']
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      )
    }

    const connection = await getConnection()

    // Verificar si ya existe una conexión para esta plataforma
    const [existing] = await connection.execute(
      'SELECT id FROM user_platform_connections WHERE user_id = ? AND platform = ?',
      [user.id, platform.toLowerCase()]
    )

    if (Array.isArray(existing) && existing.length > 0) {
      // Actualizar conexión existente
      await connection.execute(
        `UPDATE user_platform_connections 
         SET platform_user_id = ?,
             platform_username = ?,
             access_token = ?,
             refresh_token = ?,
             token_expires_at = ?,
             is_active = TRUE,
             metadata = ?,
             updated_at = NOW()
         WHERE user_id = ? AND platform = ?`,
        [
          platform_user_id,
          platform_username,
          access_token,
          refresh_token,
          token_expires_at ? new Date(token_expires_at) : null,
          metadata ? JSON.stringify(metadata) : null,
          user.id,
          platform.toLowerCase()
        ]
      )
    } else {
      // Crear nueva conexión
      await connection.execute(
        `INSERT INTO user_platform_connections 
         (user_id, platform, platform_user_id, platform_username, access_token, refresh_token, token_expires_at, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          platform.toLowerCase(),
          platform_user_id,
          platform_username,
          access_token,
          refresh_token,
          token_expires_at ? new Date(token_expires_at) : null,
          metadata ? JSON.stringify(metadata) : null
        ]
      )
    }

    // Importar avatar y banner del perfil después de conectar
    try {
      await importProfileMedia(user.id, access_token, platform.toLowerCase())
    } catch (error) {
      console.error('Error importing profile media:', error)
      // No fallar la conexión si esto falla
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error connecting platform:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Desconectar una plataforma
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform parameter is required' },
        { status: 400 }
      )
    }

    const connection = await getConnection()
    await connection.execute(
      'DELETE FROM user_platform_connections WHERE user_id = ? AND platform = ?',
      [user.id, platform.toLowerCase()]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error disconnecting platform:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


