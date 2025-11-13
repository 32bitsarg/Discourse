import pool from './db'

export interface Setting {
  id: number
  key_name: string
  value: string | null
  description: string | null
  created_at: Date
  updated_at: Date
}

/**
 * Obtiene un setting por su key
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const [rows] = await pool.execute(
      'SELECT value FROM settings WHERE key_name = ?',
      [key]
    ) as any[]

    if (rows.length === 0) {
      return null
    }

    return rows[0].value
  } catch (error) {
    console.error(`Error obteniendo setting ${key}:`, error)
    return null
  }
}

/**
 * Obtiene el nombre del sitio
 */
export async function getSiteName(): Promise<string> {
  const siteName = await getSetting('site_name')
  return siteName || 'Discourse'
}

/**
 * Actualiza un setting
 */
export async function updateSetting(key: string, value: string, description?: string): Promise<boolean> {
  try {
    if (description) {
      await pool.execute(
        'INSERT INTO settings (key_name, value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?, description = ?',
        [key, value, description, value, description]
      )
    } else {
      await pool.execute(
        'INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        [key, value, value]
      )
    }
    return true
  } catch (error) {
    console.error(`Error actualizando setting ${key}:`, error)
    return false
  }
}

/**
 * Obtiene todos los settings
 */
export async function getAllSettings(): Promise<Setting[]> {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM settings ORDER BY key_name'
    ) as any[]

    return rows
  } catch (error) {
    console.error('Error obteniendo settings:', error)
    return []
  }
}

