import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getCache, setCache } from '@/lib/redis'

const CACHE_TTL = 86400 // 24 horas - las imágenes no cambian

/**
 * Endpoint para servir imágenes comprimidas
 * Con caché HTTP agresivo para reducir Fast Origin Transfer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const imageId = parseInt(id)

    if (isNaN(imageId)) {
      return NextResponse.json(
        { message: 'ID de imagen inválido' },
        { status: 400 }
      )
    }

    // Intentar obtener del cache Redis primero
    const cacheKey = `image:${imageId}`
    const cached = await getCache<{ data: Buffer; mimeType: string }>(cacheKey)
    
    if (cached) {
      return new NextResponse(cached.data, {
        headers: {
          'Content-Type': cached.mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'CDN-Cache-Control': 'public, max-age=31536000',
          'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }

    // Obtener imagen de la base de datos
    const [images] = await pool.execute(
      'SELECT image_data, mime_type FROM post_images WHERE id = ?',
      [imageId]
    ) as any[]

    if (images.length === 0) {
      return NextResponse.json(
        { message: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    const image = images[0]
    const imageBuffer = Buffer.from(image.image_data)
    const mimeType = image.mime_type

    // Guardar en cache Redis
    await setCache(cacheKey, { data: imageBuffer, mimeType }, CACHE_TTL)

    // Retornar imagen con headers de caché agresivos
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000',
        'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
        'X-Content-Type-Options': 'nosniff',
        'Content-Length': imageBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error obteniendo imagen:', error)
    return NextResponse.json(
      { message: 'Error al obtener la imagen' },
      { status: 500 }
    )
  }
}

