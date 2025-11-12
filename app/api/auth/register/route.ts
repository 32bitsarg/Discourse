import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, setUserSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
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

    // Iniciar sesión automáticamente
    await setUserSession(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { message: 'Error al registrarse' },
      { status: 500 }
    )
  }
}

