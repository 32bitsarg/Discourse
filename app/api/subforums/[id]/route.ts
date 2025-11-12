import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateCache } from '@/lib/redis'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { message: 'Debes iniciar sesión para editar comunidades' },
        { status: 401 }
      )
    }

    const { id } = await params
    const subforumId = parseInt(id)
    const { name, description, image_url, banner_url } = await request.json()

    if (isNaN(subforumId)) {
      return NextResponse.json(
        { message: 'ID de comunidad inválido' },
        { status: 400 }
      )
    }

    // Verificar que la comunidad existe y el usuario es el creador
    const [subforums] = await pool.execute(
      'SELECT id, creator_id, name, name_changed_at FROM subforums WHERE id = ?',
      [subforumId]
    ) as any[]

    if (subforums.length === 0) {
      return NextResponse.json(
        { message: 'Comunidad no encontrada' },
        { status: 404 }
      )
    }

    const subforum = subforums[0]

    // Solo el creador puede editar
    if (subforum.creator_id !== user.id) {
      return NextResponse.json(
        { message: 'Solo el creador de la comunidad puede editarla' },
        { status: 403 }
      )
    }

    // Validar descripción
    if (!description || !description.trim()) {
      return NextResponse.json(
        { message: 'La descripción es requerida' },
        { status: 400 }
      )
    }

    // Si el nombre cambió, verificar restricción de 7 días
    if (name && name.trim() !== subforum.name) {
      if (subforum.name_changed_at) {
        const lastChange = new Date(subforum.name_changed_at)
        const now = new Date()
        const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysSinceChange < 7) {
          const daysRemaining = 7 - daysSinceChange
          return NextResponse.json(
            { message: `Puedes cambiar el nombre nuevamente en ${daysRemaining} día${daysRemaining > 1 ? 's' : ''}` },
            { status: 400 }
          )
        }
      }

      // Generar nuevo slug
      const newSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Verificar si el nuevo slug ya existe
      const [existing] = await pool.execute(
        'SELECT id FROM subforums WHERE slug = ? AND id != ?',
        [newSlug, subforumId]
      ) as any[]

      if (existing.length > 0) {
        return NextResponse.json(
          { message: 'Este nombre de comunidad ya existe' },
          { status: 400 }
        )
      }

      // Actualizar nombre, slug y name_changed_at
      await pool.execute(
        'UPDATE subforums SET name = ?, slug = ?, description = ?, image_url = ?, banner_url = ?, name_changed_at = NOW() WHERE id = ?',
        [name.trim(), newSlug, description.trim(), image_url || null, banner_url || null, subforumId]
      )
    } else {
      // Solo actualizar descripción e imágenes (sin cambiar nombre)
      await pool.execute(
        'UPDATE subforums SET description = ?, image_url = ?, banner_url = ? WHERE id = ?',
        [description.trim(), image_url || null, banner_url || null, subforumId]
      )
    }

    // Invalidar cache
    await invalidateCache('subforums:*')
    await invalidateCache('stats:*')
    await invalidateCache(`user:${user.id}:communities`)

    return NextResponse.json({ message: 'Comunidad actualizada exitosamente' })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al actualizar la comunidad' },
      { status: 500 }
    )
  }
}

