import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, setUserSession } from '@/lib/auth'
import { isPublicRegistrationEnabled, getMinimumAge, isCaptchaRequiredOnRegistration } from '@/lib/settings-validation'
import { sendWelcomeEmail } from '@/lib/email'
import { getSetting } from '@/lib/settings'
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { verifyRecaptcha } from '@/lib/captcha'
import { createVerificationToken } from '@/lib/email-verification'
import { isEmailVerificationRequired } from '@/lib/settings-validation'

export async function POST(request: NextRequest) {
  try {
    // Verificar rate limit
    const rateLimit = await checkRateLimit(request, 'register')
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

    // Verificar si el registro público está habilitado
    const publicRegistrationEnabled = await isPublicRegistrationEnabled()
    if (!publicRegistrationEnabled) {
      return NextResponse.json(
        { message: 'El registro público está deshabilitado' },
        { status: 403 }
      )
    }

    const { username, email, password, birthdate, captchaToken } = await request.json()

    // Verificar CAPTCHA si está habilitado
    const captchaRequired = await isCaptchaRequiredOnRegistration()
    if (captchaRequired) {
      if (!captchaToken) {
        return NextResponse.json(
          { message: 'CAPTCHA requerido' },
          { status: 400 }
        )
      }

      const captchaValid = await verifyRecaptcha(captchaToken)
      if (!captchaValid) {
        return NextResponse.json(
          { message: 'CAPTCHA inválido. Por favor intenta de nuevo.' },
          { status: 400 }
        )
      }
    }

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar edad mínima
    if (birthdate) {
      const birthDate = new Date(birthdate)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      const minimumAge = await getMinimumAge()
      if (age < minimumAge) {
        return NextResponse.json(
          { message: `Debes tener al menos ${minimumAge} años para registrarte` },
          { status: 403 }
        )
      }
    } else {
      // Si no se proporciona fecha de nacimiento, requerirla si hay edad mínima configurada
      const minimumAge = await getMinimumAge()
      if (minimumAge > 0) {
        return NextResponse.json(
          { message: 'La fecha de nacimiento es requerida' },
          { status: 400 }
        )
      }
    }

    // Verificar si el email ya existe
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { message: 'Este email ya está registrado' },
        { status: 400 }
      )
    }

    // Crear usuario (createUser ya valida username)
    let user
    try {
      user = await createUser(username, email, password)
    } catch (error) {
      if (error instanceof Error && error.message.includes('nombre de usuario')) {
        return NextResponse.json(
          { message: error.message },
          { status: 400 }
        )
      }
      throw error
    }

    // Verificar si se requiere verificación de email
    const emailVerificationRequired = await isEmailVerificationRequired()
    
    if (emailVerificationRequired) {
      // Crear y enviar token de verificación
      await createVerificationToken(user.id, email)
      
      return NextResponse.json({
        message: 'Registro exitoso. Por favor verifica tu email antes de iniciar sesión.',
        requiresVerification: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          email_verified: false,
        },
      })
    } else {
      // Si no se requiere verificación, marcar como verificado y iniciar sesión
      const pool = (await import('@/lib/db')).default
      await pool.execute(
        'UPDATE users SET email_verified = TRUE WHERE id = ?',
        [user.id]
      )

      // Iniciar sesión automáticamente
      await setUserSession(user.id)

      // Enviar email de bienvenida si está habilitado
      const sendWelcomeEmails = await getSetting('send_welcome_emails')
      if (sendWelcomeEmails === 'true') {
        // Enviar en background (no esperar respuesta)
        sendWelcomeEmail(user.email, user.username).catch(error => {
          console.error('Error enviando email de bienvenida:', error)
        })
      }

      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          email_verified: true,
        },
      })
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al registrarse' },
      { status: 500 }
    )
  }
}

