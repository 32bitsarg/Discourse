import { NextRequest, NextResponse } from 'next/server'
import { getMainPool } from '@/lib/db-tenant'
import { slugify } from '@/lib/utils/slug'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { message: 'Slug es requerido' },
        { status: 400 }
      )
    }

    // Validar formato
    const validSlug = slugify(slug)
    if (validSlug !== slug) {
      return NextResponse.json({
        available: false,
        message: 'El slug solo puede contener letras, números y guiones',
      })
    }

    // Verificar disponibilidad
    const mainPool = getMainPool()
    const [rows] = await mainPool.execute(
      'SELECT id FROM tenants WHERE slug = ?',
      [slug]
    ) as any[]

    const available = rows.length === 0

    return NextResponse.json({
      available,
      slug: validSlug,
      message: available 
        ? 'Este slug está disponible' 
        : 'Este slug ya está en uso',
    })
  } catch (error: any) {
    console.error('Error checking slug:', error)
    return NextResponse.json(
      { message: 'Error al verificar el slug' },
      { status: 500 }
    )
  }
}

