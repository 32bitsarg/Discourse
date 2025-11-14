const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

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

    // Leer y ejecutar el SQL de migración
    const sqlPath = path.join(__dirname, '../lib/migrations/add-images-table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Ejecutar cada statement por separado
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      await connection.execute(statement)
      console.log('✅ Ejecutado:', statement.substring(0, 50) + '...')
    }

    console.log('\n✅ Migración completada exitosamente')
    console.log('📝 Tabla post_images creada para almacenar imágenes comprimidas')

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

