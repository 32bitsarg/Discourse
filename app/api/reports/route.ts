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

    // Verificar si es admin o moderador
    const admin = await isAdmin()
    if (!admin) {
      // Verificar si es moderador de alguna comunidad
      const [moderatorCheck] = await pool.execute(
        'SELECT COUNT(*) as count FROM subforum_members WHERE user_id = ? AND role IN (?, ?)',
        [user.id, 'moderator', 'admin']
      ) as any[]

      if (moderatorCheck[0].count === 0) {
        return NextResponse.json(
          { message: 'No tienes permisos para ver reportes' },
          { status: 403 }
        )
      }
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Obtener reportes
    const [reports] = await pool.execute(`
      SELECT 
        r.id,
        r.user_id,
        r.post_id,
        r.comment_id,
        r.reason,
        r.description,
        r.status,
        r.reviewed_by,
        r.reviewed_at,
        r.action_taken,
        r.created_at,
        u.username as reporter_username,
        reviewer.username as reviewer_username,
        p.title as post_title,
        p.slug as post_slug,
        c.content as comment_content,
        c.author_id as comment_author_id,
        comment_author.username as comment_author_username,
        post_author.id as post_author_id,
        post_author.username as post_author_username
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      LEFT JOIN posts p ON r.post_id = p.id
      LEFT JOIN users post_author ON p.author_id = post_author.id
      LEFT JOIN comments c ON r.comment_id = c.id
      LEFT JOIN users comment_author ON c.author_id = comment_author.id
      WHERE r.status = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [status, limit, offset]) as any[]

    // Contar total de reportes por estado
    const [counts] = await pool.execute(`
      SELECT status, COUNT(*) as count
      FROM reports
      GROUP BY status
    `) as any[]

    const statusCounts = counts.reduce((acc: any, row: any) => {
      acc[row.status] = row.count
      return acc
    }, {})

    // Caché HTTP corto (30s) - los reportes cambian frecuentemente
    return NextResponse.json({
      reports: reports.map((report: any) => ({
        id: report.id,
        reporter: {
          id: report.user_id,
          username: report.reporter_username,
        },
        post: report.post_id ? {
          id: report.post_id,
          title: report.post_title,
          slug: report.post_slug,
          author: {
            id: report.post_author_id,
            username: report.post_author_username,
          },
        } : null,
        comment: report.comment_id ? {
          id: report.comment_id,
          content: report.comment_content,
          author: {
            id: report.comment_author_id,
            username: report.comment_author_username,
          },
        } : null,
        reason: report.reason,
        description: report.description,
        status: report.status,
        reviewer: report.reviewed_by ? {
          id: report.reviewed_by,
          username: report.reviewer_username,
        } : null,
        reviewedAt: report.reviewed_at,
        actionTaken: report.action_taken,
        createdAt: report.created_at,
      })),
      statusCounts,
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'CDN-Cache-Control': 'private, s-maxage=30',
        'Vercel-CDN-Cache-Control': 'private, s-maxage=30',
      },
    })
  } catch (error) {
    console.error('Error obteniendo reportes:', error)
    return NextResponse.json(
      { message: 'Error al obtener los reportes' },
      { status: 500 }
    )
  }
}

