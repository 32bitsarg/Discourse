const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

async function migrate() {
  let connection
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'discourse',
    })

    console.log('✅ Conectado a la base de datos')

    // Agregar campo edited_at a posts si no existe
    try {
      // MySQL no soporta IF NOT EXISTS en ALTER TABLE, así que verificamos primero
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'edited_at'
      `, [process.env.DB_NAME || 'discourse'])
      
      if (Array.isArray(columns) && columns.length === 0) {
        await connection.execute(`
          ALTER TABLE posts 
          ADD COLUMN edited_at TIMESTAMP NULL DEFAULT NULL
        `)
        console.log('✅ Campo edited_at agregado a posts')
      } else {
        console.log('ℹ️  Campo edited_at ya existe en posts')
      }
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo edited_at ya existe en posts')
      } else {
        throw error
      }
    }

    // Agregar campo edited_at a comments si no existe
    try {
      // MySQL no soporta IF NOT EXISTS en ALTER TABLE, así que verificamos primero
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'comments' AND COLUMN_NAME = 'edited_at'
      `, [process.env.DB_NAME || 'discourse'])
      
      if (Array.isArray(columns) && columns.length === 0) {
        await connection.execute(`
          ALTER TABLE comments 
          ADD COLUMN edited_at TIMESTAMP NULL DEFAULT NULL
        `)
        console.log('✅ Campo edited_at agregado a comments')
      } else {
        console.log('ℹ️  Campo edited_at ya existe en comments')
      }
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Campo edited_at ya existe en comments')
      } else {
        throw error
      }
    }

    console.log('✅ Migración completada exitosamente')
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
