const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function migrate() {
  let connection

  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'discourse',
    })

    console.log('✅ Conectado a la base de datos')

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'migrate-all-settings.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Ejecutar el SQL
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.length > 0) {
        await connection.execute(statement)
      }
    }

    console.log('✅ Migración completada exitosamente')
    console.log('✅ Todos los settings han sido agregados a la base de datos')
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

migrate()

