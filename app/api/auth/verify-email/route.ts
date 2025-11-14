import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken, resendVerificationEmail } from '@/lib/email-verification'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET - Verificar email con token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Token requerido' },
        { status: 400 }
      )
    }

    const result = await verifyEmailToken(token)

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      )
    }

    // Redirigir a página de éxito
    return NextResponse.redirect(new URL('/verify-email?success=true', request.url))
  } catch (error) {
    console.error('Error verificando email:', error)
    return NextResponse.json(
      { message: 'Error al verificar el email' },
      { status: 500 }
    )
  }
}

/**
 * POST - Reenviar email de verificación
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    const result = await resendVerificationEmail(user.id)

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: result.message,
    })
  } catch (error) {
    console.error('Error reenviando email de verificación:', error)
    return NextResponse.json(
      { message: 'Error al reenviar el email de verificación' },
      { status: 500 }
    )
  }
}

