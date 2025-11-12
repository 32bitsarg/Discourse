import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getConnection } from '@/lib/db'

// POST - Ejecutar sincronización automática para usuarios con auto_sync activado
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { platform } = body

    const connection = await getConnection()

    // Obtener conexiones con auto_sync activado
    let query = `
      SELECT * FROM user_platform_connections 
      WHERE user_id = ? AND is_active = TRUE AND auto_sync = TRUE
    `
    const params: any[] = [user.id]

    if (platform) {
      query += ' AND platform = ?'
      params.push(platform.toLowerCase())
    }

    const [connections] = await connection.execute(query, params)

    if (!Array.isArray(connections) || connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No connections with auto-sync enabled',
        synced: 0
      })
    }

    const results = []

    for (const conn of connections as any[]) {
      try {
        // Verificar si es hora de sincronizar según la frecuencia
        const now = new Date()
        const lastSync = conn.last_sync_at ? new Date(conn.last_sync_at) : null
        
        let shouldSync = true
        if (lastSync) {
          const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
          
          switch (conn.sync_frequency) {
            case 'hourly':
              shouldSync = hoursSinceSync >= 1
              break
            case 'daily':
              shouldSync = hoursSinceSync >= 24
              break
            case 'weekly':
              shouldSync = hoursSinceSync >= 168 // 7 días
              break
          }
        }

        if (!shouldSync) {
          continue
        }

        // Importar contenido
        const importRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/social/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            platform: conn.platform,
            create_post: false
          })
        })

        if (importRes.ok) {
          const importData = await importRes.json()
          results.push({
            platform: conn.platform,
            success: true,
            imported: importData.imported || 0,
            updated: importData.updated || 0
          })

          // Actualizar last_sync_at
          await connection.execute(
            'UPDATE user_platform_connections SET last_sync_at = NOW() WHERE id = ?',
            [conn.id]
          )
        } else {
          results.push({
            platform: conn.platform,
            success: false,
            error: 'Import failed'
          })
        }
      } catch (error: any) {
        results.push({
          platform: conn.platform,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      synced: results.filter(r => r.success).length
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

