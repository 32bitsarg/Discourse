import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getConnection } from '@/lib/db'

// POST - Seguir a un usuario
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = await params
    const connection = await getConnection()

    // Obtener el usuario a seguir
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    )

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const targetUser = users[0] as any

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Verificar si ya lo sigue
    const [existing] = await connection.execute(
      'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [user.id, targetUser.id]
    )

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ error: 'Already following' }, { status: 400 })
    }

    // Crear el follow
    await connection.execute(
      'INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)',
      [user.id, targetUser.id]
    )

    return NextResponse.json({ success: true, following: true })
  } catch (error: any) {
    console.error('Error following user:', error)
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Already following' }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Dejar de seguir a un usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username } = await params
    const connection = await getConnection()

    // Obtener el usuario a dejar de seguir
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    )

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const targetUser = users[0] as any

    // Eliminar el follow
    const [result] = await connection.execute(
      'DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [user.id, targetUser.id]
    )

    return NextResponse.json({ success: true, following: false })
  } catch (error: any) {
    console.error('Error unfollowing user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Verificar si el usuario actual sigue a este usuario
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ following: false })
    }

    const { username } = await params
    const connection = await getConnection()

    // Obtener el usuario
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    )

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const targetUser = users[0] as any

    // Verificar si lo sigue
    const [follows] = await connection.execute(
      'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [user.id, targetUser.id]
    )

    const isFollowing = Array.isArray(follows) && follows.length > 0

    // Obtener contadores
    const [followers] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?',
      [targetUser.id]
    )
    const [following] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?',
      [targetUser.id]
    )

    return NextResponse.json({
      following: isFollowing,
      followers: Array.isArray(followers) && followers.length > 0 ? (followers[0] as any).count : 0,
      following_count: Array.isArray(following) && following.length > 0 ? (following[0] as any).count : 0,
    })
  } catch (error: any) {
    console.error('Error checking follow status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

