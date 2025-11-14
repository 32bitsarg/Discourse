import pool from '@/lib/db'

export type NotificationType = 
  | 'reply' 
  | 'mention' 
  | 'upvote' 
  | 'downvote'
  | 'new_post' 
  | 'community_approved'
  | 'comment_upvote'
  | 'comment_reply'

interface CreateNotificationParams {
  userId: number
  type: NotificationType
  content: string
  relatedPostId?: number
  relatedCommentId?: number
  relatedUserId?: number
}

/**
 * Crea una notificación para un usuario
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await pool.execute(
      `INSERT INTO notifications 
       (user_id, type, content, related_post_id, related_comment_id, related_user_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.userId,
        params.type,
        params.content,
        params.relatedPostId || null,
        params.relatedCommentId || null,
        params.relatedUserId || null,
      ]
    )
  } catch (error) {
    // No fallar si hay error creando notificación
    console.error('Error creando notificación:', error)
  }
}

/**
 * Obtiene las notificaciones de un usuario
 */
export async function getUserNotifications(
  userId: number,
  limit: number = 50,
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<{
  notifications: any[]
  unreadCount: number
}> {
  let query = `
    SELECT 
      n.id,
      n.type,
      n.content,
      n.related_post_id,
      n.related_comment_id,
      n.related_user_id,
      n.read,
      n.created_at,
      u.username as related_username,
      u.avatar_url as related_avatar_url
    FROM notifications n
    LEFT JOIN users u ON n.related_user_id = u.id
    WHERE n.user_id = ?
  `

  const params: any[] = [userId]

  if (unreadOnly) {
    query += ' AND n.read = FALSE'
  }

  query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const [notifications] = await pool.execute(query, params) as any[]

  // Obtener conteo de no leídas
  const [countResult] = await pool.execute(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = FALSE',
    [userId]
  ) as any[]

  return {
    notifications: notifications || [],
    unreadCount: countResult[0]?.count || 0,
  }
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
  await pool.execute(
    'UPDATE notifications SET read = TRUE WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  )
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  await pool.execute(
    'UPDATE notifications SET read = TRUE WHERE user_id = ? AND read = FALSE',
    [userId]
  )
}

/**
 * Elimina una notificación
 */
export async function deleteNotification(notificationId: number, userId: number): Promise<void> {
  await pool.execute(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [notificationId, userId]
  )
}

