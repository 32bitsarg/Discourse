import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { message: 'Slug requerido' },
        { status: 400 }
      )
    }

    // Obtener comunidad por slug (sin filtrar pendientes)
    const [subforums] = await pool.execute(`
      SELECT
        s.id,
        s.name,
        s.slug,
        s.description,
        s.member_count,
        s.post_count,
        s.image_url,
        s.banner_url,
        s.is_public,
        s.requires_approval,
        s.created_at,
        s.name_changed_at,
        s.creator_id,
        u.username as creator_username
      FROM subforums s
      LEFT JOIN users u ON s.creator_id = u.id
      WHERE s.slug = ?
      LIMIT 1
    `, [slug]) as any[]

    if (subforums.length === 0) {
      return NextResponse.json(
        { message: 'Comunidad no encontrada' },
        { status: 404 }
      )
    }

    // Caché HTTP para comunidades por slug
    return NextResponse.json({ subforum: subforums[0] }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
      },
    })
  } catch (error: any) {
    console.error('Error obteniendo comunidad por slug:', error)
    return NextResponse.json(
      { message: 'Error al obtener la comunidad' },
      { status: 500 }
    )
  }
}

