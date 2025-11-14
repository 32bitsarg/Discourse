const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'discourse',
    multipleStatements: true,
  })

  try {
    console.log('📦 Aplicando migración de verificación de email...')

    const sql = fs.readFileSync(
      path.join(__dirname, 'migrate-email-verification.sql'),
      'utf8'
    )

    await connection.query(sql)
    console.log('✅ Migración de verificación de email completada exitosamente')
  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message)
    process.exit(1)
  } finally {
    await connection.end()
  }
}

migrate()

