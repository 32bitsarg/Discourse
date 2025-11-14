import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import pool from '@/lib/db'
import { invalidateCache } from '@/lib/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ isMember: false, status: null })
    }

    const { id } = await params
    const subforumId = parseInt(id)

    if (isNaN(subforumId)) {
      return NextResponse.json({ isMember: false, status: null })
    }

    // Verificar membresía
    const [members] = await pool.execute(
      'SELECT status, role FROM subforum_members WHERE subforum_id = ? AND user_id = ?',
      [subforumId, user.id]
    ) as any[]

    if (members.length === 0) {
      return NextResponse.json({ isMember: false, status: null })
    }

    // Caché HTTP (5 min) - el estado de membresía no cambia frecuentemente
    return NextResponse.json({
      isMember: members[0].status === 'approved',
      status: members[0].status,
      role: members[0].role,
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'private, s-maxage=300',
        'Vercel-CDN-Cache-Control': 'private, s-maxage=300',
      },
    })
  } catch (error) {
    return NextResponse.json({ isMember: false, status: null })
  }
}

