import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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

    // Log para debugging
    console.log('Twitter OAuth - Base URL:', baseUrl)
    console.log('Twitter OAuth - Redirect URI:', redirectUri)
    console.log('Twitter OAuth - Client ID:', twitterClientId ? 'Set' : 'Missing')

    // Generar un state aleatorio para seguridad
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    
    // Guardar el state en una cookie para verificarlo en el callback
    const cookieStore = await cookies()
    cookieStore.set('twitter_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutos
    })

    // Scopes mínimos necesarios para login
    const twitterScopes = ['tweet.read', 'users.read', 'offline.access']
    const authUrl = `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${twitterClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(twitterScopes.join(' '))}&` +
      `state=${state}&` +
      `code_challenge=challenge&` +
      `code_challenge_method=plain`

    console.log('Twitter OAuth - Auth URL:', authUrl.replace(/client_id=[^&]+/, 'client_id=***'))

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Error initiating Twitter OAuth for login:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed?error=oauth_error`
    )
  }
}

