import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// GET - Iniciar OAuth flow para login/registro con Twitter
export async function GET(request: NextRequest) {
  try {
    const twitterClientId = process.env.TWITTER_CLIENT_ID
    if (!twitterClientId) {
      return NextResponse.json(
        { error: 'Twitter credentials not configured' },
        { status: 500 }
      )
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

    // Generar un state aleatorio para seguridad
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    // Generar PKCE code verifier y challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
    
    // Guardar el state y code_verifier en cookies para verificarlos en el callback
    const cookieStore = await cookies()
    cookieStore.set('twitter_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutos
    })
    cookieStore.set('twitter_oauth_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutos
    })

    // Scopes mínimos necesarios para login - solo los esenciales
    // Nota: Si 'users.read' requiere aprobación, intentar solo con 'offline.access'
    // o verificar en Twitter Developer Portal si hay scopes más básicos disponibles
    const twitterScopes = ['users.read', 'offline.access']
    const authUrl = `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${twitterClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(twitterScopes.join(' '))}&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`

    // Log para debugging
    console.log('Twitter OAuth - Base URL:', baseUrl)
    console.log('Twitter OAuth - Redirect URI:', redirectUri)
    console.log('Twitter OAuth - Client ID:', twitterClientId ? 'Set' : 'Missing')
    console.log('Twitter OAuth - Scopes:', twitterScopes.join(' '))
    console.log('Twitter OAuth - Code Challenge Method: S256')
    console.log('Twitter OAuth - Auth URL:', authUrl.replace(/client_id=[^&]+/, 'client_id=***'))

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Error initiating Twitter OAuth for login:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed?error=oauth_error`
    )
  }
}

