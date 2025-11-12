import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getConnection } from '@/lib/db'

// POST - Registrar múltiples eventos de comportamiento en batch
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { events } = body

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Invalid events format' }, { status: 400 })
    }

    // Limitar tamaño del batch
    const batch = events.slice(0, 20)

    const connection = await getConnection()

    // Preparar valores para inserción masiva
    const values: any[] = []
    const placeholders: string[] = []

    for (const event of batch) {
      if (!event.actionType) continue

      values.push(
        user.id,
        event.postId || null,
        event.actionType,
        event.durationSeconds || null,
        event.metadata ? JSON.stringify(event.metadata) : null
      )
      placeholders.push('(?, ?, ?, ?, ?)')
    }

    if (values.length === 0) {
      return NextResponse.json({ success: true, processed: 0 })
    }

    // Inserción masiva
    const query = `
      INSERT INTO user_behavior (user_id, post_id, action_type, duration_seconds, metadata)
      VALUES ${placeholders.join(', ')}
    `

    await connection.execute(query, values)

    return NextResponse.json({ 
      success: true, 
      processed: values.length / 5 // 5 valores por evento
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

