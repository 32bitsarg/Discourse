import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/db'
import { cookies } from 'next/headers'
import { createUser, getUserByEmail, setUserSession } from '@/lib/auth'
import crypto from 'crypto'

// GET - Callback de OAuth para login/registro con Twitter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed?error=${error}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed?error=missing_params`
      )
    }

    // Verificar el state y obtener el code_verifier
    const cookieStore = await cookies()
    const savedState = cookieStore.get('twitter_oauth_state')?.value
    const codeVerifier = cookieStore.get('twitter_oauth_code_verifier')?.value
    
    if (!savedState || savedState !== state) {
      console.error('Invalid state - possible CSRF attack')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed?error=invalid_state`
      )
    }

    if (!codeVerifier) {
      console.error('Missing code_verifier')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed?error=missing_code_verifier`
      )
    }

    // Limpiar las cookies
    cookieStore.delete('twitter_oauth_state')
    cookieStore.delete('twitter_oauth_code_verifier')

    const twitterClientId = process.env.TWITTER_CLIENT_ID
    const twitterClientSecret = process.env.TWITTER_CLIENT_SECRET
    
    if (!twitterClientId || !twitterClientSecret) {
      throw new Error('Twitter credentials not configured')
    }

    // Obtener la URL base - verificar tanto NEXT_PUBLIC_BASE_URL como construir desde request
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    
    // Si no está configurado, intentar construir desde el request
    if (!baseUrl) {
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
      if (host) {
        baseUrl = `${protocol}://${host}`
      } else {
        baseUrl = 'http://localhost:3000'
      }
    }
    
    // Asegurarse de que no tenga trailing slash
    baseUrl = baseUrl.replace(/\/$/, '')
    
    const redirectUri = `${baseUrl}/api/auth/twitter/login/callback`
    
    console.log('Twitter OAuth Callback - Base URL:', baseUrl)
    console.log('Twitter OAuth Callback - Redirect URI:', redirectUri)

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
            code_verifier: codeVerifier
          })
    })

    if (!twitterTokenRes.ok) {
      const errorText = await twitterTokenRes.text()
      console.error('Twitter token exchange error:', errorText)
      console.error('Redirect URI used:', redirectUri)
      console.error('Code received:', code ? 'yes' : 'no')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed?error=token_exchange_failed&details=${encodeURIComponent(errorText)}`
      )
    }

    const tokenData = await twitterTokenRes.json()

    // Obtener información del usuario de Twitter
    const twitterUserRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,email', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!twitterUserRes.ok) {
      throw new Error('Failed to fetch Twitter user info')
    }

    const twitterUser = await twitterUserRes.json()
    const twitterData = twitterUser.data

    if (!twitterData) {
      throw new Error('No user data from Twitter')
    }

    const connection = await getConnection()

    // Buscar si ya existe un usuario con este Twitter ID
    const [existingConnections] = await connection.execute(
      'SELECT user_id FROM user_platform_connections WHERE platform = ? AND platform_user_id = ? AND is_active = TRUE',
      ['twitter', twitterData.id]
    )

    let userId: number

    if (Array.isArray(existingConnections) && existingConnections.length > 0) {
      // Usuario existente - hacer login
      const existingConnection = existingConnections[0] as any
      userId = existingConnection.user_id

      // Actualizar el token de acceso
      await connection.execute(
        `UPDATE user_platform_connections 
         SET access_token = ?, 
             refresh_token = ?,
             token_expires_at = DATE_ADD(NOW(), INTERVAL ? SECOND),
             updated_at = NOW()
         WHERE user_id = ? AND platform = ? AND platform_user_id = ?`,
        [
          tokenData.access_token,
          tokenData.refresh_token || null,
          tokenData.expires_in || 7200,
          userId,
          'twitter',
          twitterData.id
        ]
      )
    } else {
      // Nuevo usuario - crear cuenta
      // Generar email si no está disponible (Twitter no siempre proporciona email)
      let email = twitterData.email || `twitter_${twitterData.id}@temp.local`
      
      // Si el email es temporal, verificar que no exista otro usuario con ese patrón
      if (email.includes('@temp.local')) {
        const [emailCheck] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [email]
        )
        
        if (Array.isArray(emailCheck) && emailCheck.length > 0) {
          // Generar un email único
          email = `twitter_${twitterData.id}_${Date.now()}@temp.local`
        }
      } else {
        // Verificar si el email ya existe
        const existingUser = await getUserByEmail(email)
        if (existingUser) {
          // Si existe, conectar la cuenta de Twitter a este usuario
          userId = existingUser.id
          
          // Guardar la conexión
          await connection.execute(
            `INSERT INTO user_platform_connections 
             (user_id, platform, platform_user_id, platform_username, access_token, refresh_token, token_expires_at, is_active, metadata)
             VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), TRUE, ?)
             ON DUPLICATE KEY UPDATE
               access_token = VALUES(access_token),
               refresh_token = VALUES(refresh_token),
               token_expires_at = VALUES(token_expires_at),
               is_active = TRUE,
               updated_at = NOW()`,
            [
              userId,
              'twitter',
              twitterData.id,
              twitterData.username,
              tokenData.access_token,
              tokenData.refresh_token || null,
              tokenData.expires_in || 7200,
              JSON.stringify(twitterData)
            ]
          )

          // Importar avatar y banner
          await importProfileMedia(userId, tokenData.access_token, 'twitter')

          // Iniciar sesión
          await setUserSession(userId)

          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed?twitter_connected=true`
          )
        }
      }

      // Crear nuevo usuario
      const username = twitterData.username || `twitter_${twitterData.id}`
      
      // Verificar que el username no exista, si existe agregar sufijo
      let finalUsername = username
      let usernameExists = true
      let counter = 1
      
      while (usernameExists) {
        const [userCheck] = await connection.execute(
          'SELECT id FROM users WHERE username = ?',
          [finalUsername]
        )
        
        if (Array.isArray(userCheck) && userCheck.length === 0) {
          usernameExists = false
        } else {
          finalUsername = `${username}_${counter}`
          counter++
        }
      }

      // Generar una contraseña aleatoria (el usuario puede cambiarla después)
      const randomPassword = crypto.randomBytes(16).toString('hex')
      
      const newUser = await createUser(finalUsername, email, randomPassword)
      userId = newUser.id

      // Guardar la conexión de Twitter
      await connection.execute(
        `INSERT INTO user_platform_connections 
         (user_id, platform, platform_user_id, platform_username, access_token, refresh_token, token_expires_at, is_active, metadata)
         VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), TRUE, ?)`,
        [
          userId,
          'twitter',
          twitterData.id,
          twitterData.username,
          tokenData.access_token,
          tokenData.refresh_token || null,
          tokenData.expires_in || 7200,
          JSON.stringify(twitterData)
        ]
      )

      // Importar avatar y banner
      await importProfileMedia(userId, tokenData.access_token, 'twitter')
    }

    // Iniciar sesión
    await setUserSession(userId)

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed?twitter_login=success`
    )
  } catch (error: any) {
    console.error('Error in Twitter login callback:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed?error=${encodeURIComponent(error.message || 'oauth_error')}`
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
            // Intentar obtener banner con API v1.1
            try {
              const twitterV1Res = await fetch('https://api.twitter.com/1.1/account/verify_credentials.json?include_entities=false&skip_status=true', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
              })
              if (twitterV1Res.ok) {
                const twitterV1Data = await twitterV1Res.json()
                bannerUrl = twitterV1Data.profile_banner_url || null
              }
            } catch (e) {
              // Ignorar error de v1.1
            }
          }
        }
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
    // No fallar si esto falla
  }
}

