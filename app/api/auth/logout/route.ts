import { NextRequest, NextResponse } from 'next/server'
import { clearUserSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await clearUserSession()
    return NextResponse.json({ message: 'Sesión cerrada' })
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}

