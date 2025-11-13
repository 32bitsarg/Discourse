/**
 * Script de migración: Agregar tabla settings
 * 
 * Este script agrega la tabla settings a la base de datos existente
 * y configura los valores por defecto.
 * 
 * Uso:
 *   node scripts/migrate-add-settings.js
 */

require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function migrate() {
  let connection = null

  try {
    // Verificar variables de entorno
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      throw new Error('Faltan variables de entorno de base de datos. Verifica tu archivo .env.local')
    }

    console.log('🔄 Iniciando migración: Agregar tabla settings...\n')

    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true,
    })

    console.log('✅ Conectado a la base de datos\n')

    // Leer el archivo SQL de migración
    const sqlPath = path.join(__dirname, 'migrate-add-settings.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Ejecutar la migración
    console.log('📝 Ejecutando migración SQL...')
    await connection.query(sqlContent)
    console.log('✅ Migración ejecutada exitosamente\n')

    // Verificar que la tabla se creó correctamente
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'settings'"
    )

    if (tables.length > 0) {
      console.log('✅ Tabla settings creada/verificada\n')

      // Verificar valores por defecto
      const [settings] = await connection.query(
        'SELECT * FROM settings'
      )

      console.log('📋 Configuración actual:')
      settings.forEach(setting => {
        console.log(`   - ${setting.key_name}: ${setting.value}`)
      })
      console.log('')
    } else {
      throw new Error('La tabla settings no se creó correctamente')
    }

    console.log('✨ Migración completada exitosamente!')
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 Conexión cerrada')
    }
  }
}

// Ejecutar migración
migrate()

