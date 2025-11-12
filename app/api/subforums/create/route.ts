import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateCache } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para crear una comunidad' },
        { status: 401 }
      )
    }

    const { name, description, isPublic, requiresApproval, image_url, banner_url } = await request.json()

    if (!name || !description) {
      return NextResponse.json(
        { message: 'Nombre y descripción son requeridos' },
        { status: 400 }
      )
    }

    // Si es privada, siempre requiere aprobación
    const finalRequiresApproval = !isPublic || requiresApproval || false

    // Generar slug único
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Verificar si el slug ya existe
    const [existing] = await pool.execute(
      'SELECT id FROM subforums WHERE slug = ?',
      [slug]
    ) as any[]

    if (existing.length > 0) {
      return NextResponse.json(
        { message: 'Este nombre de comunidad ya existe' },
        { status: 400 }
      )
    }

    // Crear el subforo (category_id es opcional, puede ser NULL)
    const [result] = await pool.execute(
      'INSERT INTO subforums (creator_id, name, slug, description, is_public, requires_approval, image_url, banner_url, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)',
      [user.id, name, slug, description, isPublic, finalRequiresApproval, image_url || null, banner_url || null]
    ) as any

    // Agregar al creador como admin del subforo (status approved automáticamente)
    await pool.execute(
      'INSERT INTO subforum_members (subforum_id, user_id, role, status) VALUES (?, ?, ?, ?)',
      [result.insertId, user.id, 'admin', 'approved']
    )

    // Invalidar cache de comunidades y estadísticas
    await invalidateCache('subforums:*')
    await invalidateCache('stats:*')
    await invalidateCache(`user:${user.id}:communities`) // Invalidar cache de "Mis comunidades"

    return NextResponse.json({
      message: 'Comunidad creada exitosamente',
      subforum: {
        id: result.insertId,
        name,
        slug,
        description,
        isPublic,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al crear la comunidad' },
      { status: 500 }
    )
  }
}

