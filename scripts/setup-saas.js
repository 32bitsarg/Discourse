/**
 * Script para configurar el sistema SaaS
 * Ejecuta las migraciones necesarias para convertir Discourse en SaaS
 */

const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function setupSaaS() {
  let connection

  try {
    console.log('🚀 Configurando Discourse como SaaS...\n')

    // Verificar variables de entorno
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      throw new Error('Faltan variables de entorno de base de datos. Verifica tu archivo .env.local')
    }

    // Conectar a MySQL
    console.log('📡 Conectando a MySQL...')
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
    })

    console.log('✅ Conectado a MySQL\n')

    // Leer y ejecutar el esquema SaaS
    console.log('📋 Creando tablas de SaaS...')
    const saasSchemaPath = path.join(__dirname, '../lib/database-saas.sql')
    
    if (!fs.existsSync(saasSchemaPath)) {
      throw new Error(`No se encontró el archivo: ${saasSchemaPath}`)
    }

    const saasSchema = fs.readFileSync(saasSchemaPath, 'utf8')
    
    // Limpiar el SQL: remover comentarios y dividir en statements
    const cleanedSql = cleanSqlContent(saasSchema)
    
    // Ejecutar el esquema
    await connection.query(`USE ${process.env.DB_NAME}`)
    
    // Ejecutar cada statement individualmente
    for (let i = 0; i < cleanedSql.length; i++) {
      const statement = cleanedSql[i]
      if (statement.trim().length > 0) {
        try {
          await connection.query(statement)
        } catch (error) {
          // Ignorar errores de "table already exists" o "duplicate entry"
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️  Ya existe: ${statement.substring(0, 50)}...`)
          } else {
            console.error(`❌ Error en statement ${i + 1}:`, error.message)
            throw error
          }
        }
      }
    }

    console.log('✅ Tablas de SaaS creadas\n')

    // Verificar que los planes se insertaron correctamente
    const [plans] = await connection.query('SELECT COUNT(*) as count FROM subscription_plans')
    console.log(`✅ ${plans[0].count} planes de suscripción creados\n`)

    console.log('🎉 ¡Configuración SaaS completada!\n')
    console.log('Próximos pasos:')
    console.log('1. Configura MAIN_DOMAIN en tu .env.local')
    console.log('2. Configura DNS wildcard (*.tu-dominio.com)')
    console.log('3. Inicia el servidor: npm run dev')
    console.log('4. Visita /register para crear tu primer tenant\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupSaaS()
}

/**
 * Limpia el contenido SQL removiendo comentarios y dividiendo en statements
 */
function cleanSqlContent(sql) {
  const lines = sql.split('\n')
  const cleanedLines = lines.map(line => {
    const commentIndex = line.indexOf('--')
    if (commentIndex >= 0) {
      return line.substring(0, commentIndex).trim()
    }
    return line.trim()
  }).filter(line => line.length > 0)

  const fullSql = cleanedLines.join('\n')
  const statements = fullSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length > 10) // Filtrar statements muy cortos

  return statements.map(stmt => stmt + ';') // Agregar punto y coma al final
}

module.exports = { setupSaaS }

