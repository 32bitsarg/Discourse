import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/db'

// GET - Callback de OAuth para intercambiar código por token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // user_id
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/user/profile?error=${error}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/user/profile?error=missing_params`
      )
    }

    const userId = parseInt(state)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/auth/${platform}/callback`

    let tokenData: any = {}
    let userInfo: any = {}

    // Intercambiar código por token
    if (platform.toLowerCase() !== 'twitter') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/user/profile?error=unsupported_platform`
      )
    }

    switch (platform.toLowerCase()) {
      case 'twitter':
        const twitterClientId = process.env.TWITTER_CLIENT_ID
        const twitterClientSecret = process.env.TWITTER_CLIENT_SECRET
        
        if (!twitterClientId || !twitterClientSecret) {
          throw new Error('Twitter credentials not configured')
        }

        // Intercambiar código por token
        const twitterTokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${twitterClientId}:${twitterClientSecret}`).toString('base64')}`
          },
          body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_id: twitterClientId,
            redirect_uri: redirectUri,
            code_verifier: 'challenge'
          })
        })

        if (!twitterTokenRes.ok) {
          throw new Error('Failed to exchange Twitter token')
        }

        tokenData = await twitterTokenRes.json()

        // Obtener información del usuario
        const twitterUserRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        })

        if (twitterUserRes.ok) {
          const twitterUser = await twitterUserRes.json()
          userInfo = {
            platform_user_id: twitterUser.data.id,
            platform_username: twitterUser.data.username,
            metadata: twitterUser.data
          }
        }
        break

      // Próximamente: Facebook, Instagram, LinkedIn
      default:
        throw new Error('Unsupported platform')
    }

    // Guardar conexión en la base de datos
    const connection = await getConnection()

    // Verificar si ya existe
    const [existing] = await connection.execute(
      'SELECT id FROM user_platform_connections WHERE user_id = ? AND platform = ?',
      [userId, platform.toLowerCase()]
    )

    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : null

    if (Array.isArray(existing) && existing.length > 0) {
      // Actualizar
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
          userInfo.platform_user_id,
          userInfo.platform_username,
          tokenData.access_token,
          tokenData.refresh_token || null,
          expiresAt,
          JSON.stringify(userInfo.metadata || {}),
          userId,
          platform.toLowerCase()
        ]
      )
    } else {
      // Crear nueva
      await connection.execute(
        `INSERT INTO user_platform_connections 
         (user_id, platform, platform_user_id, platform_username, access_token, refresh_token, token_expires_at, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          platform.toLowerCase(),
          userInfo.platform_user_id,
          userInfo.platform_username,
          tokenData.access_token,
          tokenData.refresh_token || null,
          expiresAt,
          JSON.stringify(userInfo.metadata || {})
        ]
      )
    }

    // Importar avatar y banner
    try {
      await importProfileMedia(userId, tokenData.access_token, platform.toLowerCase())
    } catch (error) {
      console.error('Error importing profile media:', error)
      // No fallar si esto falla
    }

    // Redirigir al perfil
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/user/profile?connected=${platform}`
    )
  } catch (error: any) {
    console.error('Error in OAuth callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/user/profile?error=${encodeURIComponent(error.message)}`
    )
  }
}

// Función helper para importar avatar y banner
async function importProfileMedia(userId: number, accessToken: string, platform: string) {
  const connection = await getConnection()
  
  try {
    let avatarUrl: string | null = null
    let bannerUrl: string | null = null

    switch (platform) {
      case 'twitter':
        const twitterRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        if (twitterRes.ok) {
          const twitterData = await twitterRes.json()
          if (twitterData.data) {
            avatarUrl = twitterData.data.profile_image_url?.replace('_normal', '_400x400') || null
          }
        }
        break

      // Próximamente: Facebook, Instagram, LinkedIn
      default:
        break
    }

    // Actualizar usuario
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

