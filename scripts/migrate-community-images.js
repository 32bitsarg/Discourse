// Script para migrar y agregar campos de imagen y banner a comunidades
require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function migrate() {
  console.log('=== Migrando esquema para imágenes de comunidades ===\n')

  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('❌ Error: Faltan variables de entorno de base de datos')
    process.exit(1)
  }

  let connection
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
    })

    console.log('Conectado a la base de datos\n')

    // Verificar y agregar campos de imagen y banner a subforums
    console.log('Agregando campos a tabla subforums...')
    
    try {
      await connection.execute(`
        ALTER TABLE subforums 
        ADD COLUMN image_url VARCHAR(500) NULL DEFAULT NULL
      `)
      console.log('✅ Campo image_url agregado a subforums')
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Campo image_url ya existe, omitiendo...')
      } else {
        throw error
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE subforums 
        ADD COLUMN banner_url VARCHAR(500) NULL DEFAULT NULL
      `)
      console.log('✅ Campo banner_url agregado a subforums')
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Campo banner_url ya existe, omitiendo...')
      } else {
        throw error
      }
    }

    console.log('\n✅ Migración completada!')
    await connection.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (connection) {
      await connection.end()
    }
    process.exit(1)
  }
}

migrate()

