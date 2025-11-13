import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

export async function POST(request: NextRequest) {
  try {
    const {
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      dbName,
    } = await request.json()

    // Validaciones
    if (!dbHost || !dbUser || !dbPassword || !dbName) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Probar conexión a BD
    let connection
    try {
      connection = await mysql.createConnection({
        host: dbHost,
        port: parseInt(dbPort || '3306'),
        user: dbUser,
        password: dbPassword,
      })

      // Probar que podemos crear/usar la BD
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
      await connection.query(`USE \`${dbName}\``)

      await connection.end()

      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa',
      })
    } catch (error: any) {
      if (connection) {
        await connection.end()
      }
      return NextResponse.json(
        { message: `Error conectando a MySQL: ${error.message}` },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error en test-connection:', error)
    return NextResponse.json(
      {
        message: error.message || 'Error probando conexión',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

