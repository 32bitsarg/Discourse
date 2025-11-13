import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verificar si las tablas principales existen
    const [tables] = await pool.execute("SHOW TABLES LIKE 'users'") as any[]
    
    const isInstalled = tables.length > 0
    
    // Si está instalado, verificar que hay al menos un usuario admin
    let hasAdmin = false
    if (isInstalled) {
      const [users] = await pool.execute('SELECT COUNT(*) as count FROM users') as any[]
      hasAdmin = users[0]?.count > 0
    }
    
    return NextResponse.json({
      installed: isInstalled,
      hasAdmin,
    })
  } catch (error: any) {
    // Si hay error de conexión o BD no existe, no está instalado
    return NextResponse.json({
      installed: false,
      hasAdmin: false,
      error: error.message,
    })
  }
}

