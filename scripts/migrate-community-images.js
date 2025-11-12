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
      // Verificar si el campo existe y su tipo
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subforums' AND COLUMN_NAME = 'image_url'
      `, [process.env.DB_NAME || 'discourse'])
      
      if (Array.isArray(columns) && columns.length === 0) {
        // Campo no existe, crearlo como TEXT
        await connection.execute(`
          ALTER TABLE subforums 
          ADD COLUMN image_url TEXT NULL DEFAULT NULL
        `)
        console.log('✅ Campo image_url agregado a subforums')
      } else if (columns.length > 0) {
        // Campo existe, verificar si es VARCHAR(500) y cambiarlo a TEXT
        const columnType = columns[0].COLUMN_TYPE
        if (columnType && columnType.includes('varchar')) {
          await connection.execute(`
            ALTER TABLE subforums 
            MODIFY COLUMN image_url TEXT NULL DEFAULT NULL
          `)
          console.log('✅ Campo image_url actualizado a TEXT')
        } else {
          console.log('ℹ️  Campo image_url ya existe con tipo correcto')
        }
      }
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Campo image_url ya existe, omitiendo...')
      } else {
        throw error
      }
    }

    try {
      // Verificar si el campo existe y su tipo
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'subforums' AND COLUMN_NAME = 'banner_url'
      `, [process.env.DB_NAME || 'discourse'])
      
      if (Array.isArray(columns) && columns.length === 0) {
        // Campo no existe, crearlo como TEXT
        await connection.execute(`
          ALTER TABLE subforums 
          ADD COLUMN banner_url TEXT NULL DEFAULT NULL
        `)
        console.log('✅ Campo banner_url agregado a subforums')
      } else if (columns.length > 0) {
        // Campo existe, verificar si es VARCHAR(500) y cambiarlo a TEXT
        const columnType = columns[0].COLUMN_TYPE
        if (columnType && columnType.includes('varchar')) {
          await connection.execute(`
            ALTER TABLE subforums 
            MODIFY COLUMN banner_url TEXT NULL DEFAULT NULL
          `)
          console.log('✅ Campo banner_url actualizado a TEXT')
        } else {
          console.log('ℹ️  Campo banner_url ya existe con tipo correcto')
        }
      }
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

