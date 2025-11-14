import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { isAdmin } from '@/lib/admin-dashboard'
import { logModerationAction, banUser } from '@/lib/moderation'

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
    const reportId = parseInt(id)

    if (isNaN(reportId)) {
      return NextResponse.json(
        { message: 'ID de reporte inválido' },
        { status: 400 }
      )
    }

    // Verificar si es admin o moderador
    const admin = await isAdmin()
    let isModerator = false

    if (!admin) {
      // Verificar si es moderador de alguna comunidad
      const [moderatorCheck] = await pool.execute(
        'SELECT COUNT(*) as count FROM subforum_members WHERE user_id = ? AND role IN (?, ?)',
        [user.id, 'moderator', 'admin']
      ) as any[]

      isModerator = moderatorCheck[0].count > 0

      if (!isModerator) {
        return NextResponse.json(
          { message: 'No tienes permisos para realizar esta acción' },
          { status: 403 }
        )
      }
    }

    const { action, actionTaken } = await request.json()

    if (!action || !['delete', 'hide', 'dismiss', 'warn'].includes(action)) {
      return NextResponse.json(
        { message: 'Acción inválida' },
        { status: 400 }
      )
    }

    // Obtener el reporte
    const [reports] = await pool.execute(
      'SELECT * FROM reports WHERE id = ?',
      [reportId]
    ) as any[]

    if (reports.length === 0) {
      return NextResponse.json(
        { message: 'Reporte no encontrado' },
        { status: 404 }
      )
    }

    const report = reports[0]

    if (report.status !== 'pending') {
      return NextResponse.json(
        { message: 'Este reporte ya ha sido procesado' },
        { status: 400 }
      )
    }

    // Realizar la acción según el tipo
    if (action === 'delete') {
      if (report.post_id) {
        // Eliminar post
        await pool.execute('DELETE FROM posts WHERE id = ?', [report.post_id])
        await logModerationAction({
          moderatorId: user.id,
          targetType: 'post',
          targetId: report.post_id,
          action: 'delete',
          reason: actionTaken || 'Contenido reportado',
        })
      } else if (report.comment_id) {
        // Eliminar comentario (CASCADE eliminará replies automáticamente)
        await pool.execute('DELETE FROM comments WHERE id = ?', [report.comment_id])
        await logModerationAction({
          moderatorId: user.id,
          targetType: 'comment',
          targetId: report.comment_id,
          action: 'delete',
          reason: actionTaken || 'Contenido reportado',
        })
      }
    } else if (action === 'hide') {
      // Agregar campo hidden si no existe (para futuras implementaciones)
      // Por ahora, marcamos como eliminado
      if (report.post_id) {
        // Podríamos agregar un campo `hidden` a posts en el futuro
        await pool.execute('UPDATE posts SET title = CONCAT("[OCULTO] ", title) WHERE id = ?', [report.post_id])
        await logModerationAction({
          moderatorId: user.id,
          targetType: 'post',
          targetId: report.post_id,
          action: 'hide',
          reason: actionTaken || 'Contenido reportado',
        })
      } else if (report.comment_id) {
        await pool.execute('UPDATE comments SET content = "[Comentario oculto]" WHERE id = ?', [report.comment_id])
        await logModerationAction({
          moderatorId: user.id,
          targetType: 'comment',
          targetId: report.comment_id,
          action: 'hide',
          reason: actionTaken || 'Contenido reportado',
        })
      }
    } else if (action === 'warn') {
      // Obtener el autor del contenido reportado para advertir
      let targetUserId: number | null = null
      if (report.post_id) {
        const [posts] = await pool.execute('SELECT author_id FROM posts WHERE id = ?', [report.post_id]) as any[]
        if (posts.length > 0) {
          targetUserId = posts[0].author_id
        }
      } else if (report.comment_id) {
        const [comments] = await pool.execute('SELECT author_id FROM comments WHERE id = ?', [report.comment_id]) as any[]
        if (comments.length > 0) {
          targetUserId = comments[0].author_id
        }
      }
      
      if (targetUserId) {
        await logModerationAction({
          moderatorId: user.id,
          targetType: 'user',
          targetId: targetUserId,
          action: 'warn',
          reason: actionTaken || 'Advertencia por contenido reportado',
        })
      }
    }

    // Actualizar el reporte
    await pool.execute(
      `UPDATE reports 
       SET status = ?, 
           reviewed_by = ?, 
           reviewed_at = NOW(), 
           action_taken = ?
       WHERE id = ?`,
      [
        action === 'dismiss' ? 'dismissed' : 'resolved',
        user.id,
        actionTaken || action,
        reportId,
      ]
    )

    return NextResponse.json({
      message: `Acción "${action}" aplicada exitosamente`,
    })
  } catch (error) {
    console.error('Error procesando acción de reporte:', error)
    return NextResponse.json(
      { message: 'Error al procesar la acción' },
      { status: 500 }
    )
  }
}

