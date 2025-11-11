import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// GET - Iniciar OAuth flow para una plataforma
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = await params
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/auth/${platform}/callback`

    let authUrl = ''

    switch (platform.toLowerCase()) {
      case 'twitter':
        // Twitter OAuth 2.0
        const twitterClientId = process.env.TWITTER_CLIENT_ID
        if (!twitterClientId) {
          return NextResponse.json(
            { error: 'Twitter credentials not configured' },
            { status: 500 }
          )
        }
        
        const twitterScopes = ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
        authUrl = `https://twitter.com/i/oauth2/authorize?` +
          `response_type=code&` +
          `client_id=${twitterClientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=${encodeURIComponent(twitterScopes.join(' '))}&` +
          `state=${user.id}&` +
          `code_challenge=challenge&` +
          `code_challenge_method=plain`
        break

      // Próximamente: Facebook, Instagram, LinkedIn
      default:
        return NextResponse.json(
          { error: 'Unsupported platform. Only Twitter/X is available at the moment.' },
          { status: 400 }
        )
    }

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Error initiating OAuth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

