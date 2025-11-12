import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getConnection } from '@/lib/db'

// POST - Registrar comportamiento del usuario
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, action_type, duration_seconds, metadata } = body

    if (!action_type) {
      return NextResponse.json({ error: 'action_type is required' }, { status: 400 })
    }

    const connection = await getConnection()

    await connection.execute(
      'INSERT INTO user_behavior (user_id, post_id, action_type, duration_seconds, metadata) VALUES (?, ?, ?, ?, ?)',
      [
        user.id,
        post_id || null,
        action_type,
        duration_seconds || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

