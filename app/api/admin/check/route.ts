import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

/**
 * Verifica si el usuario actual es admin basado en NEXT_PUBLIC_ADMINS
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      // Retornar 200 con isAdmin: false en lugar de 401 para evitar errores en SWR
      return NextResponse.json({ isAdmin: false }, {
        status: 200,
        headers: {
          'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
          'CDN-Cache-Control': 'private, s-maxage=30',
          'Vercel-CDN-Cache-Control': 'private, s-maxage=30',
        },
      })
    }

    const adminIds = process.env.NEXT_PUBLIC_ADMINS
    if (!adminIds) {
      return NextResponse.json({ isAdmin: false })
    }

    const identifiers = adminIds.split(',').map(id => id.trim()).filter(id => id.length > 0)
    
    // Verificar por ID o username
    for (const identifier of identifiers) {
      // Si es numérico, comparar con ID
      const numId = parseInt(identifier)
      if (!isNaN(numId) && numId === user.id) {
        return NextResponse.json({ isAdmin: true }, {
          headers: {
            'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
            'CDN-Cache-Control': 'private, s-maxage=30',
            'Vercel-CDN-Cache-Control': 'private, s-maxage=30',
          },
        })
      }
      // Si no es numérico o no coincide, comparar con username
      if (identifier.toLowerCase() === user.username.toLowerCase()) {
        return NextResponse.json({ isAdmin: true }, {
          headers: {
            'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
            'CDN-Cache-Control': 'private, s-maxage=30',
            'Vercel-CDN-Cache-Control': 'private, s-maxage=30',
          },
        })
      }
    }
    
    // Caché HTTP corto (30s) - el estado de admin no cambia frecuentemente
    return NextResponse.json({ isAdmin: false }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'private, s-maxage=30',
        'Vercel-CDN-Cache-Control': 'private, s-maxage=30',
      },
    })
  } catch (error: any) {
    console.error('Error verificando admin:', error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}

