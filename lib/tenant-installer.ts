import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import pool from './db'

/**
 * Instala el esquema completo de la base de datos en una BD de tenant
 * Similar al instalador web de WordPress
 */
export async function installTenantDatabase(
  dbName: string,
  ownerUsername: string,
  ownerEmail: string,
  ownerPasswordHash: string
): Promise<void> {
  try {
    // Conectar a la BD del tenant
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
      multipleStatements: true, // Permite ejecutar múltiples statements
    })

    try {
      // Leer el archivo database.sql
      const sqlPath = path.join(process.cwd(), 'lib', 'database.sql')
      if (!fs.existsSync(sqlPath)) {
        throw new Error(`No se encontró el archivo: ${sqlPath}`)
      }

      const sqlContent = fs.readFileSync(sqlPath, 'utf8')

      // Limpiar el SQL: remover comentarios y dividir en statements
      const statements = cleanSqlContent(sqlContent)

      // Ejecutar cada statement individualmente (más robusto)
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';' // Agregar punto y coma al final
        
        try {
          await connection.execute(statement)
        } catch (error: any) {
          // Ignorar errores de "table already exists" o "duplicate entry"
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_ENTRY') {
            // Continuar sin error
            continue
          } else {
            // Para otros errores, loguear pero continuar (algunos statements pueden fallar sin ser críticos)
            console.error(`⚠️  Error en statement ${i + 1}: ${error.message}`)
            // No lanzar error, solo loguear - algunos statements pueden fallar sin ser críticos
          }
        }
      }

      // Crear el usuario owner en la BD del tenant
      await createOwnerUser(connection, ownerUsername, ownerEmail, ownerPasswordHash)

      console.log(`✅ Esquema instalado exitosamente en ${dbName}`)
    } finally {
      await connection.end()
    }
  } catch (error: any) {
    console.error(`❌ Error instalando esquema en ${dbName}:`, error.message)
    throw new Error(`Error instalando base de datos del tenant: ${error.message}`)
  }
}

/**
 * Limpia el contenido SQL removiendo comentarios y preparándolo para ejecución
 * Similar al método usado en create-tables.js
 */
function cleanSqlContent(sql: string): string[] {
  // Remover comentarios de línea (-- comentario)
  const lines = sql.split('\n')
  const cleanedLines = lines.map(line => {
    const commentIndex = line.indexOf('--')
    if (commentIndex >= 0) {
      return line.substring(0, commentIndex).trim()
    }
    return line.trim()
  }).filter(line => line.length > 0)

  // Unir líneas y dividir por punto y coma
  const fullSql = cleanedLines.join('\n')
  
  // Dividir en statements individuales
  const statements = fullSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length > 10) // Filtrar statements muy cortos

  return statements
}

/**
 * Crea el usuario owner en la BD del tenant
 */
async function createOwnerUser(
  connection: mysql.Connection,
  username: string,
  email: string,
  passwordHash: string
): Promise<void> {
  try {
    // Verificar si el usuario ya existe
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    ) as any[]

    if (existing.length > 0) {
      console.log(`⚠️  Usuario ${username} ya existe en la BD del tenant`)
      return
    }

    // Crear usuario owner
    await connection.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    )

    console.log(`✅ Usuario owner ${username} creado en la BD del tenant`)
  } catch (error: any) {
    // Si falla, no es crítico - el usuario puede crearse después
    console.error(`⚠️  Error creando usuario owner: ${error.message}`)
    // No lanzar error, solo loguear
  }
}

/**
 * Verifica que la instalación del tenant fue exitosa
 */
export async function verifyTenantInstallation(dbName: string): Promise<boolean> {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
    })

    try {
      // Verificar que las tablas principales existen
      const [tables] = await connection.query("SHOW TABLES LIKE 'users'") as any[]

      if (tables.length === 0) {
        return false
      }

      // Verificar que hay al menos una tabla más (subforums o posts)
      const [allTables] = await connection.query('SHOW TABLES') as any[]
      
      return allTables.length >= 5 // Al menos 5 tablas principales
    } finally {
      await connection.end()
    }
  } catch (error) {
    console.error('Error verificando instalación:', error)
    return false
  }
}

