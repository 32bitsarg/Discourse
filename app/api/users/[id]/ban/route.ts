import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/admin-dashboard'
import { banUser, unbanUser, isUserBanned } from '@/lib/moderation'

/**
 * POST - Banear/desbanear un usuario
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    // Solo admins pueden banear
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json(
        { message: 'No tienes permisos para banear usuarios' },
        { status: 403 }
      )
    }

    const { id } = await params
    const targetUserId = parseInt(id)

    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { message: 'ID de usuario inválido' },
        { status: 400 }
      )
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { message: 'No puedes banearte a ti mismo' },
        { status: 400 }
      )
    }

    const { action, reason, expiresAt } = await request.json()

    if (action === 'ban') {
      const expiresDate = expiresAt ? new Date(expiresAt) : undefined
      await banUser(targetUserId, user.id, reason, expiresDate)
      return NextResponse.json({ message: 'Usuario baneado exitosamente' })
    } else if (action === 'unban') {
      await unbanUser(targetUserId, user.id)
      return NextResponse.json({ message: 'Usuario desbaneado exitosamente' })
    } else {
      return NextResponse.json(
        { message: 'Acción inválida' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error ban/unban usuario:', error)
    return NextResponse.json(
      { message: 'Error al procesar la acción' },
      { status: 500 }
    )
  }
}

/**
 * GET - Verificar si un usuario está baneado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json(
        { message: 'ID de usuario inválido' },
        { status: 400 }
      )
    }

    const banned = await isUserBanned(userId)

    return NextResponse.json({ banned })
  } catch (error) {
    console.error('Error verificando ban:', error)
    return NextResponse.json(
      { message: 'Error al verificar el estado del usuario' },
      { status: 500 }
    )
  }
}

