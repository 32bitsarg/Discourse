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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/auth/twitter/login/callback`

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

    const twitterScopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
    const authUrl = `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${twitterClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(twitterScopes.join(' '))}&` +
      `state=${state}&` +
      `code_challenge=challenge&` +
      `code_challenge_method=plain`

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Error initiating Twitter OAuth for login:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feed?error=oauth_error`
    )
  }
}

