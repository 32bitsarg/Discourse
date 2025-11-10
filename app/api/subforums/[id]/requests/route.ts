import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateCache } from '@/lib/redis'

export async function GET(
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
    const subforumId = parseInt(id)

    // Verificar que el usuario es admin o mod de la comunidad
    const [members] = await pool.execute(
      'SELECT role FROM subforum_members WHERE subforum_id = ? AND user_id = ? AND status = ? AND role IN (?, ?)',
      [subforumId, user.id, 'approved', 'admin', 'moderator']
    ) as any[]

    const [subforums] = await pool.execute(
      'SELECT creator_id FROM subforums WHERE id = ?',
      [subforumId]
    ) as any[]

    const isCreator = subforums.length > 0 && subforums[0].creator_id === user.id
    const isMod = members.length > 0

    if (!isCreator && !isMod) {
      return NextResponse.json(
        { message: 'No tienes permisos para ver las solicitudes' },
        { status: 403 }
      )
    }

    // Obtener solicitudes pendientes
    const [requests] = await pool.execute(`
      SELECT 
        r.id,
        r.user_id,
        r.status,
        r.requested_at,
        u.username,
        u.karma
      FROM subforum_requests r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.subforum_id = ? AND r.status = 'pending'
      ORDER BY r.requested_at ASC
    `, [subforumId]) as any[]

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Get requests error:', error)
    return NextResponse.json(
      { message: 'Error al obtener las solicitudes' },
      { status: 500 }
    )
  }
}

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

    const { id } = await params
    const subforumId = parseInt(id)
    const { userId, action } = await request.json()

    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Datos inválidos' },
        { status: 400 }
      )
    }

    // Verificar permisos
    const [members] = await pool.execute(
      'SELECT role FROM subforum_members WHERE subforum_id = ? AND user_id = ? AND status = ? AND role IN (?, ?)',
      [subforumId, user.id, 'approved', 'admin', 'moderator']
    ) as any[]

    const [subforums] = await pool.execute(
      'SELECT creator_id FROM subforums WHERE id = ?',
      [subforumId]
    ) as any[]

    const isCreator = subforums.length > 0 && subforums[0].creator_id === user.id
    const isMod = members.length > 0

    if (!isCreator && !isMod) {
      return NextResponse.json(
        { message: 'No tienes permisos para gestionar solicitudes' },
        { status: 403 }
      )
    }

    if (action === 'approve') {
      // Actualizar membresía a approved
      await pool.execute(
        'UPDATE subforum_members SET status = ? WHERE subforum_id = ? AND user_id = ?',
        ['approved', subforumId, userId]
      )

      // Si no existe membresía, crearla
      const [existing] = await pool.execute(
        'SELECT id FROM subforum_members WHERE subforum_id = ? AND user_id = ?',
        [subforumId, userId]
      ) as any[]

      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO subforum_members (subforum_id, user_id, role, status) VALUES (?, ?, ?, ?)',
          [subforumId, userId, 'member', 'approved']
        )
      }

      // Actualizar contador
      await pool.execute(
        'UPDATE subforums SET member_count = member_count + 1 WHERE id = ?',
        [subforumId]
      )

      // Actualizar solicitud
      await pool.execute(
        'UPDATE subforum_requests SET status = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ? WHERE subforum_id = ? AND user_id = ?',
        ['approved', user.id, subforumId, userId]
      )
    } else {
      // Rechazar
      await pool.execute(
        'UPDATE subforum_members SET status = ? WHERE subforum_id = ? AND user_id = ?',
        ['rejected', subforumId, userId]
      )

      await pool.execute(
        'UPDATE subforum_requests SET status = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ? WHERE subforum_id = ? AND user_id = ?',
        ['rejected', user.id, subforumId, userId]
      )
    }

    // Invalidar cache
    await invalidateCache('subforums:*')
    await invalidateCache('posts:*')

    return NextResponse.json({
      message: action === 'approve' ? 'Solicitud aprobada' : 'Solicitud rechazada',
    })
  } catch (error) {
    console.error('Manage request error:', error)
    return NextResponse.json(
      { message: 'Error al gestionar la solicitud' },
      { status: 500 }
    )
  }
}

