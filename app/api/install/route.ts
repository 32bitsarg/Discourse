import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { hashPassword } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const {
      dbHost,
      dbPort,
      dbUser,
      dbPassword,
      dbName,
      siteName,
      adminUsername,
      adminEmail,
      adminPassword,
      redisUrl,
      redisToken,
    } = await request.json()

    // Validaciones
    if (!dbHost || !dbUser || !dbPassword || !dbName || !siteName || !adminUsername || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar contraseña
    if (adminPassword.length < 8) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 8 caracteres' },
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
        multipleStatements: true,
      })

      // Crear BD si no existe
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
      await connection.query(`USE \`${dbName}\``)
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
          }
        }
      }

      // Crear usuario admin
      const passwordHash = await hashPassword(adminPassword)
      await connection.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [adminUsername, adminEmail, passwordHash]
      )

      await connection.end()

      // Crear archivo .env.local automáticamente
      try {
        const envRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/install/env`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dbConfig: {
              host: dbHost,
              port: dbPort,
              user: dbUser,
              password: dbPassword,
              database: dbName,
            },
            redisConfig: redisUrl ? {
              url: redisUrl,
              token: redisToken,
            } : null,
          }),
        })

        if (!envRes.ok) {
          console.warn('No se pudo crear .env.local automáticamente')
        }
      } catch (envError) {
        console.warn('Error creando .env.local:', envError)
        // No es crítico, el usuario puede crearlo manualmente
      }

      return NextResponse.json({
        success: true,
        message: 'Instalación completada exitosamente',
        envCreated: true,
      })
    } catch (error: any) {
      await connection.end()
      throw error
    }
  } catch (error: any) {
    console.error('Error en instalación:', error)
    return NextResponse.json(
      {
        message: error.message || 'Error durante la instalación',
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

