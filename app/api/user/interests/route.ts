import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getConnection } from '@/lib/db'

// GET - Obtener intereses del usuario
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connection = await getConnection()
    const [interests] = await connection.execute(
      'SELECT category, weight FROM user_interests WHERE user_id = ? ORDER BY weight DESC',
      [user.id]
    )

    return NextResponse.json(
      {
        interests: Array.isArray(interests) ? interests : []
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'CDN-Cache-Control': 'public, s-maxage=600',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=600',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Actualizar intereses del usuario
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { interests } = body // Array de { category: string, weight: number }

    if (!Array.isArray(interests)) {
      return NextResponse.json({ error: 'Invalid interests format' }, { status: 400 })
    }

    const connection = await getConnection()

    // Eliminar intereses existentes
    await connection.execute(
      'DELETE FROM user_interests WHERE user_id = ?',
      [user.id]
    )

    // Insertar nuevos intereses
    if (interests.length > 0) {
      const values = interests.map((interest: any) => [
        user.id,
        interest.category,
        interest.weight || 1.0
      ])
      const placeholders = values.map(() => '(?, ?, ?)').join(', ')
      const flatValues = values.flat()

      await connection.execute(
        `INSERT INTO user_interests (user_id, category, weight) VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE weight = VALUES(weight)`,
        flatValues
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

