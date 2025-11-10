import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateCache } from '@/lib/redis'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para unirte a una comunidad' },
        { status: 401 }
      )
    }

    const { id } = await params
    const subforumId = parseInt(id)

    if (isNaN(subforumId)) {
      return NextResponse.json(
        { message: 'ID de comunidad inválido' },
        { status: 400 }
      )
    }

    // Obtener información de la comunidad
    const [subforums] = await pool.execute(
      'SELECT id, name, is_public, requires_approval, creator_id FROM subforums WHERE id = ?',
      [subforumId]
    ) as any[]

    if (subforums.length === 0) {
      return NextResponse.json(
        { message: 'Comunidad no encontrada' },
        { status: 404 }
      )
    }

    const subforum = subforums[0]

    // Verificar si ya es miembro
    const [existingMembers] = await pool.execute(
      'SELECT id, status FROM subforum_members WHERE subforum_id = ? AND user_id = ?',
      [subforumId, user.id]
    ) as any[]

    if (existingMembers.length > 0) {
      const member = existingMembers[0]
      if (member.status === 'approved') {
        return NextResponse.json(
          { message: 'Ya eres miembro de esta comunidad' },
          { status: 400 }
        )
      }
      if (member.status === 'pending') {
        return NextResponse.json(
          { message: 'Ya tienes una solicitud pendiente' },
          { status: 400 }
        )
      }
    }

    // Determinar el estado inicial
    let status = 'approved'
    if (!subforum.is_public || subforum.requires_approval) {
      status = 'pending'
    }

    // Si es privada y no es el creador, requiere aprobación
    if (!subforum.is_public && subforum.creator_id !== user.id) {
      status = 'pending'
    }

    // Si es el creador, agregarlo como admin directamente
    if (subforum.creator_id === user.id) {
      status = 'approved'
    }

    // Insertar o actualizar membresía
    if (existingMembers.length > 0) {
      // Actualizar solicitud existente
      await pool.execute(
        'UPDATE subforum_members SET status = ? WHERE id = ?',
        [status, existingMembers[0].id]
      )
    } else {
      // Crear nueva membresía
      const role = subforum.creator_id === user.id ? 'admin' : 'member'
      await pool.execute(
        'INSERT INTO subforum_members (subforum_id, user_id, role, status) VALUES (?, ?, ?, ?)',
        [subforumId, user.id, role, status]
      )
    }

    // Si fue aprobado automáticamente, actualizar contador
    if (status === 'approved') {
      await pool.execute(
        'UPDATE subforums SET member_count = member_count + 1 WHERE id = ?',
        [subforumId]
      )
    }

    // Crear solicitud en la tabla de requests si está pendiente
    if (status === 'pending') {
      await pool.execute(
        `INSERT INTO subforum_requests (subforum_id, user_id, status) 
         VALUES (?, ?, 'pending')
         ON DUPLICATE KEY UPDATE status = 'pending', requested_at = CURRENT_TIMESTAMP`,
        [subforumId, user.id]
      )
    }

    // Invalidar cache
    await invalidateCache('subforums:*')
    await invalidateCache('posts:*')

    return NextResponse.json({
      message: status === 'approved' 
        ? 'Te has unido a la comunidad' 
        : 'Solicitud enviada. Esperando aprobación',
      status,
    })
  } catch (error) {
    console.error('Join subforum error:', error)
    return NextResponse.json(
      { message: 'Error al unirse a la comunidad' },
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
    const subforumId = parseInt(id)

    if (isNaN(subforumId)) {
      return NextResponse.json(
        { message: 'ID de comunidad inválido' },
        { status: 400 }
      )
    }

    // Verificar si es miembro
    const [members] = await pool.execute(
      'SELECT id, role FROM subforum_members WHERE subforum_id = ? AND user_id = ? AND status = ?',
      [subforumId, user.id, 'approved']
    ) as any[]

    if (members.length === 0) {
      return NextResponse.json(
        { message: 'No eres miembro de esta comunidad' },
        { status: 400 }
      )
    }

    const member = members[0]

    // No permitir que el creador/admin se salga (o permitirlo, según preferencia)
    // Por ahora lo permitimos

    // Eliminar membresía
    await pool.execute(
      'DELETE FROM subforum_members WHERE id = ?',
      [member.id]
    )

    // Actualizar contador
    await pool.execute(
      'UPDATE subforums SET member_count = GREATEST(0, member_count - 1) WHERE id = ?',
      [subforumId]
    )

    // Eliminar solicitud si existe
    await pool.execute(
      'DELETE FROM subforum_requests WHERE subforum_id = ? AND user_id = ?',
      [subforumId, user.id]
    )

    // Invalidar cache
    await invalidateCache('subforums:*')
    await invalidateCache('posts:*')

    return NextResponse.json({
      message: 'Has salido de la comunidad',
    })
  } catch (error) {
    console.error('Leave subforum error:', error)
    return NextResponse.json(
      { message: 'Error al salir de la comunidad' },
      { status: 500 }
    )
  }
}

