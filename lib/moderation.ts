import pool from '@/lib/db'

/**
 * Registra una acción de moderación en el historial
 */
export async function logModerationAction(params: {
  moderatorId: number
  targetType: 'post' | 'comment' | 'user'
  targetId: number
  action: 'delete' | 'hide' | 'warn' | 'ban' | 'unban' | 'approve' | 'reject'
  reason?: string
  details?: any
}): Promise<void> {
  try {
    await pool.execute(
      `INSERT INTO moderation_history 
       (moderator_id, target_type, target_id, action, reason, details) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.moderatorId,
        params.targetType,
        params.targetId,
        params.action,
        params.reason || null,
        params.details ? JSON.stringify(params.details) : null,
      ]
    )
  } catch (error) {
    console.error('Error registrando acción de moderación:', error)
  }
}

/**
 * Banea un usuario
 */
export async function banUser(
  userId: number,
  bannedBy: number,
  reason?: string,
  expiresAt?: Date
): Promise<void> {
  // Eliminar bans anteriores del usuario
  await pool.execute(
    'DELETE FROM user_bans WHERE user_id = ?',
    [userId]
  )

  // Crear nuevo ban
  await pool.execute(
    `INSERT INTO user_bans (user_id, banned_by, reason, expires_at) 
     VALUES (?, ?, ?, ?)`,
    [userId, bannedBy, reason || null, expiresAt || null]
  )

  // Registrar en historial
  await logModerationAction({
    moderatorId: bannedBy,
    targetType: 'user',
    targetId: userId,
    action: 'ban',
    reason,
    details: { expiresAt: expiresAt?.toISOString() || null },
  })
}

/**
 * Desbanea un usuario
 */
export async function unbanUser(userId: number, unbannedBy: number): Promise<void> {
  await pool.execute(
    'DELETE FROM user_bans WHERE user_id = ?',
    [userId]
  )

  // Registrar en historial
  await logModerationAction({
    moderatorId: unbannedBy,
    targetType: 'user',
    targetId: userId,
    action: 'unban',
  })
}

/**
 * Verifica si un usuario está baneado
 */
export async function isUserBanned(userId: number): Promise<boolean> {
  // Eliminar bans expirados
  await pool.execute(
    'DELETE FROM user_bans WHERE user_id = ? AND expires_at IS NOT NULL AND expires_at < NOW()',
    [userId]
  )

  const [bans] = await pool.execute(
    'SELECT id FROM user_bans WHERE user_id = ?',
    [userId]
  ) as any[]

  return bans.length > 0
}

/**
 * Obtiene el historial de moderación
 */
export async function getModerationHistory(
  limit: number = 50,
  offset: number = 0,
  moderatorId?: number,
  targetType?: 'post' | 'comment' | 'user'
): Promise<any[]> {
  let query = `
    SELECT 
      mh.id,
      mh.target_type,
      mh.target_id,
      mh.action,
      mh.reason,
      mh.details,
      mh.created_at,
      moderator.username as moderator_username,
      moderator.id as moderator_id
    FROM moderation_history mh
    LEFT JOIN users moderator ON mh.moderator_id = moderator.id
    WHERE 1=1
  `

  const params: any[] = []

  if (moderatorId) {
    query += ' AND mh.moderator_id = ?'
    params.push(moderatorId)
  }

  if (targetType) {
    query += ' AND mh.target_type = ?'
    params.push(targetType)
  }

  query += ' ORDER BY mh.created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const [history] = await pool.execute(query, params) as any[]

  return history.map((item: any) => ({
    ...item,
    details: item.details ? JSON.parse(item.details) : null,
    created_at: item.created_at?.toISOString() || null,
  }))
}

