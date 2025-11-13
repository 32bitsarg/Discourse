import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'

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

    // Conectar a BD
    let connection
    try {
      connection = await mysql.createConnection({
        host: dbHost,
        port: parseInt(dbPort || '3306'),
        user: dbUser,
        password: dbPassword,
        database: dbName,
        multipleStatements: true,
      })
    } catch (error: any) {
      return NextResponse.json(
        { message: `Error conectando a MySQL: ${error.message}` },
        { status: 400 }
      )
    }

    try {
      // Leer y ejecutar el esquema SQL
      const sqlPath = path.join(process.cwd(), 'lib', 'database.sql')
      if (!fs.existsSync(sqlPath)) {
        throw new Error(`No se encontró el archivo: ${sqlPath}`)
      }

      const sqlContent = fs.readFileSync(sqlPath, 'utf8')
      const statements = cleanSqlContent(sqlContent)

      // Ejecutar cada statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';'
        
        try {
          await connection.execute(statement)
        } catch (error: any) {
          // Ignorar errores de "table already exists"
          if (error.code !== 'ER_TABLE_EXISTS_ERROR' && error.code !== 'ER_DUP_ENTRY') {
            console.error(`Error en statement ${i + 1}:`, error.message)
            // No lanzar error, solo loguear
          }
        }
      }

      await connection.end()

      return NextResponse.json({
        success: true,
        message: 'Tablas creadas exitosamente',
      })
    } catch (error: any) {
      await connection.end()
      throw error
    }
  } catch (error: any) {
    console.error('Error creando tablas:', error)
    return NextResponse.json(
      {
        message: error.message || 'Error creando las tablas',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

function cleanSqlContent(sql: string): string[] {
  const lines = sql.split('\n')
  const cleanedLines = lines.map(line => {
    const commentIndex = line.indexOf('--')
    if (commentIndex >= 0) {
      return line.substring(0, commentIndex).trim()
    }
    return line.trim()
  }).filter(line => line.length > 0)

  const fullSql = cleanedLines.join('\n')
  const statements = fullSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length > 10)

  return statements
}

