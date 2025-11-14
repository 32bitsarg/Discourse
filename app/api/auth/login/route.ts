import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword, setUserSession } from '@/lib/auth'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { isEmailVerificationRequired } from '@/lib/settings-validation'
import { isUserBanned } from '@/lib/moderation'

export async function POST(request: NextRequest) {
  try {
    // Verificar rate limit
    const rateLimit = await checkRateLimit(request, 'login')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        createRateLimitResponse(rateLimit.remaining, rateLimit.resetAt, rateLimit.limit),
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimit.resetAt.toString(),
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          }
        }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verificar si el usuario está baneado
    const banned = await isUserBanned(user.id)
    if (banned) {
      return NextResponse.json(
        { 
          message: 'Tu cuenta ha sido suspendida. Contacta a un administrador si crees que esto es un error.',
        },
        { status: 403 }
      )
    }

    // Verificar si se requiere verificación de email
    const emailVerificationRequired = await isEmailVerificationRequired()
    if (emailVerificationRequired && !user.email_verified) {
      return NextResponse.json(
        { 
          message: 'Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      )
    }

    await setUserSession(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified || false,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}

