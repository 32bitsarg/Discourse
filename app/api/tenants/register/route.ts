import { NextRequest, NextResponse } from 'next/server'
import { createTenant } from '@/lib/tenant'
import { createUser, getUserByEmail, hashPassword } from '@/lib/auth'
import { getMainPool } from '@/lib/db-tenant'
import { slugify } from '@/lib/utils/slug'

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      slug, 
      ownerEmail, 
      ownerUsername, 
      ownerPassword,
      customDomain 
    } = await request.json()

    // Validaciones
    if (!name || !slug || !ownerEmail || !ownerUsername || !ownerPassword) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de slug
    const validSlug = slugify(slug)
    if (validSlug !== slug) {
      return NextResponse.json(
        { message: 'El slug solo puede contener letras, números y guiones' },
        { status: 400 }
      )
    }

    // Verificar que el slug no esté en uso
    const mainPool = getMainPool()
    const [existingTenant] = await mainPool.execute(
      'SELECT id FROM tenants WHERE slug = ?',
      [slug]
    ) as any[]

    if (existingTenant.length > 0) {
      return NextResponse.json(
        { message: 'Este slug ya está en uso' },
        { status: 400 }
      )
    }

    // Verificar que el email del owner no esté en uso
    const existingUser = await getUserByEmail(ownerEmail)
    if (existingUser) {
      return NextResponse.json(
        { message: 'Este email ya está registrado' },
        { status: 400 }
      )
    }

    // Hashear contraseña para el owner
    const ownerPasswordHash = await hashPassword(ownerPassword)

    // Crear usuario owner en BD principal (para referencia en tenant_admins)
    const owner = await createUser(ownerUsername, ownerEmail, ownerPassword)

    // Crear tenant con instalación automática del esquema
    // El instalador creará automáticamente el usuario owner en la BD del tenant
    const tenant = await createTenant(
      name,
      slug,
      owner.id,
      1, // Plan free por defecto
      customDomain || undefined,
      ownerUsername,
      ownerEmail,
      ownerPasswordHash
    )

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        url: `https://${tenant.slug}.${process.env.MAIN_DOMAIN || 'discourse.com'}`,
      },
      message: 'Tenant creado exitosamente. Redirigiendo...',
    })
  } catch (error: any) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { 
        message: error.message || 'Error al crear el tenant',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

