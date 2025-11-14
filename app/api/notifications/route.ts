import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getUserNotifications, markAllNotificationsAsRead } from '@/lib/notifications'

/**
 * GET - Obtener notificaciones del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const { notifications, unreadCount } = await getUserNotifications(
      user.id,
      limit,
      offset,
      unreadOnly
    )

    // Caché HTTP corto (30s) - las notificaciones cambian frecuentemente
    return NextResponse.json({
      notifications,
      unreadCount,
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'private, s-maxage=30',
        'Vercel-CDN-Cache-Control': 'private, s-maxage=30',
      },
    })
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error)
    return NextResponse.json(
      { message: 'Error al obtener las notificaciones' },
      { status: 500 }
    )
  }
}

/**
 * POST - Marcar todas las notificaciones como leídas
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

    await markAllNotificationsAsRead(user.id)

    return NextResponse.json({ message: 'Notificaciones marcadas como leídas' })
  } catch (error) {
    console.error('Error marcando notificaciones:', error)
    return NextResponse.json(
      { message: 'Error al marcar las notificaciones' },
      { status: 500 }
    )
  }
}

