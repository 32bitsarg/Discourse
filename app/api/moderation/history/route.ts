import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/admin-dashboard'
import { getModerationHistory } from '@/lib/moderation'

/**
 * GET - Obtener historial de moderación
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

    // Solo admins pueden ver el historial completo
    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json(
        { message: 'No tienes permisos para ver el historial de moderación' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const moderatorId = searchParams.get('moderatorId') ? parseInt(searchParams.get('moderatorId')!) : undefined
    const targetType = searchParams.get('targetType') as 'post' | 'comment' | 'user' | undefined

    const history = await getModerationHistory(limit, offset, moderatorId, targetType)

    // Caché HTTP corto (1 min) - el historial cambia cuando se realizan acciones
    return NextResponse.json({ history }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'private, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'private, s-maxage=60',
      },
    })
  } catch (error) {
    console.error('Error obteniendo historial de moderación:', error)
    return NextResponse.json(
      { message: 'Error al obtener el historial de moderación' },
      { status: 500 }
    )
  }
}

