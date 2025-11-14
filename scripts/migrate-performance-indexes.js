const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

async function addIndexes() {
  let connection

  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'discourse',
      multipleStatements: true,
    })

    console.log('✅ Conectado a la base de datos')

    // Leer el archivo SQL
    const fs = require('fs')
    const path = require('path')
    const sqlFile = fs.readFileSync(
      path.join(__dirname, '../lib/migrations/add-performance-indexes.sql'),
      'utf8'
    )

    // Dividir en statements individuales
    const statements = sqlFile
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Ejecutando ${statements.length} statements...`)

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.includes('CREATE INDEX')) {
        try {
          await connection.execute(statement)
          const indexName = statement.match(/idx_\w+/)?.[0] || 'unknown'
          console.log(`  ✅ Índice creado: ${indexName}`)
        } catch (error) {
          // Si el índice ya existe, ignorar el error
          if (error.code === 'ER_DUP_KEYNAME' || 
              error.code === 'ER_DUP_ENTRY' ||
              error.message.includes('Duplicate key name') ||
              error.message.includes('already exists')) {
            const indexName = statement.match(/idx_\w+/)?.[0] || 'unknown'
            console.log(`  ⚠️  Índice ya existe: ${indexName} (ignorado)`)
          } else {
            console.error(`  ❌ Error creando índice:`, error.message)
            throw error
          }
        }
      }
    }

    console.log('\n✅ Migración completada exitosamente')
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 Conexión cerrada')
    }
  }
}

// Ejecutar migración
addIndexes()

