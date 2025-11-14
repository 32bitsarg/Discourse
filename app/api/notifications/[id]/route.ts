import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { markNotificationAsRead, deleteNotification } from '@/lib/notifications'

/**
 * PUT - Marcar notificación como leída
 * DELETE - Eliminar notificación
 */
export async function PUT(
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

    const { id } = await params
    const notificationId = parseInt(id)

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { message: 'ID de notificación inválido' },
        { status: 400 }
      )
    }

    await markNotificationAsRead(notificationId, user.id)

    return NextResponse.json({ message: 'Notificación marcada como leída' })
  } catch (error) {
    console.error('Error marcando notificación:', error)
    return NextResponse.json(
      { message: 'Error al marcar la notificación' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { id } = await params
    const notificationId = parseInt(id)

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { message: 'ID de notificación inválido' },
        { status: 400 }
      )
    }

    await deleteNotification(notificationId, user.id)

    return NextResponse.json({ message: 'Notificación eliminada' })
  } catch (error) {
    console.error('Error eliminando notificación:', error)
    return NextResponse.json(
      { message: 'Error al eliminar la notificación' },
      { status: 500 }
    )
  }
}

