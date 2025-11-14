const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

async function migrate() {
  let connection
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'discourse',
      multipleStatements: true,
    })

    console.log('Conectado a la base de datos')

    const sqlFile = path.join(__dirname, '../lib/migrations/add-moderation-tables.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    // Dividir por punto y coma y ejecutar cada statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      try {
        await connection.execute(statement)
        console.log('✓ Ejecutado:', statement.substring(0, 50) + '...')
      } catch (error) {
        // Ignorar errores de "table already exists" o "duplicate key"
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
          console.log('⚠ Ya existe:', statement.substring(0, 50) + '...')
        } else {
          throw error
        }
      }
    }

    console.log('\n✅ Migración completada exitosamente')
  } catch (error) {
    console.error('❌ Error en la migración:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

migrate()

