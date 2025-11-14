import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { isAdmin } from '@/lib/admin-dashboard'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    // Verificar si es admin
    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json(
        { message: 'No tienes permisos para ver comunidades pendientes' },
        { status: 403 }
      )
    }

    // Obtener comunidades pendientes (donde requires_approval = true y no tienen miembros aprobados además del creador)
    // O comunidades que fueron creadas pero aún no han sido aprobadas por un admin
    const [pendingCommunities] = await pool.execute(`
      SELECT 
        s.id,
        s.name,
        s.slug,
        s.description,
        s.is_public,
        s.requires_approval,
        s.image_url,
        s.banner_url,
        s.created_at,
        s.creator_id,
        u.username as creator_username,
        u.email as creator_email,
        COUNT(DISTINCT sm.id) as member_count
      FROM subforums s
      LEFT JOIN users u ON s.creator_id = u.id
      LEFT JOIN subforum_members sm ON s.id = sm.subforum_id AND sm.status = 'approved'
      WHERE s.requires_approval = TRUE
      GROUP BY s.id
      HAVING member_count <= 1
      ORDER BY s.created_at DESC
    `) as any[]

    // Caché HTTP corto (1 min) - las comunidades pendientes cambian cuando se aprueban
    return NextResponse.json({
      communities: pendingCommunities || [],
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'private, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'private, s-maxage=60',
      },
    })
  } catch (error: any) {
    console.error('Error obteniendo comunidades pendientes:', error)
    return NextResponse.json(
      { message: 'Error al obtener comunidades pendientes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión' },
        { status: 401 }
      )
    }

    // Verificar si es admin
    const admin = await isAdmin(user.id)
    if (!admin) {
      return NextResponse.json(
        { message: 'No tienes permisos para aprobar/rechazar comunidades' },
        { status: 403 }
      )
    }

    const { communityId, action } = await request.json()

    if (!communityId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Datos inválidos' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Aprobar comunidad: desactivar requires_approval
      await pool.execute(
        'UPDATE subforums SET requires_approval = FALSE WHERE id = ?',
        [communityId]
      )
    } else {
      // Rechazar comunidad: eliminar la comunidad
      await pool.execute(
        'DELETE FROM subforums WHERE id = ?',
        [communityId]
      )
    }

    return NextResponse.json({
      message: action === 'approve' ? 'Comunidad aprobada' : 'Comunidad rechazada',
    })
  } catch (error: any) {
    console.error('Error gestionando comunidad:', error)
    return NextResponse.json(
      { message: 'Error al gestionar la comunidad' },
      { status: 500 }
    )
  }
}

