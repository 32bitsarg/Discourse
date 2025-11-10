// Script para crear las tablas automáticamente
require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

async function createTables() {
  console.log('=== Creando tablas en MySQL ===\n')

  // Validar que existan las variables de entorno
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('❌ Error: Faltan variables de entorno de base de datos')
    console.error('   Crea un archivo .env.local con las credenciales necesarias')
    console.error('   Puedes usar .env.example como referencia')
    process.exit(1)
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true, // Permite ejecutar múltiples statements
  })

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'lib', 'database.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('Ejecutando esquema SQL...\n')

    // Dividir el SQL en statements individuales
    // Primero quitar comentarios de línea
    const sqlWithoutComments = sql
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('--')
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex).trim()
        }
        return line.trim()
      })
      .filter(line => line.length > 0)
      .join('\n')

    // Dividir por punto y coma
    const statements = sqlWithoutComments
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length > 10) // Filtrar statements muy cortos

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';' // Agregar punto y coma al final
      if (statement.length > 0) {
        try {
          await connection.execute(statement)
          // Extraer el nombre de la tabla si es CREATE TABLE
          const tableMatch = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i)
          if (tableMatch) {
            console.log(`✅ Tabla creada: ${tableMatch[1]}`)
          } else if (statement.match(/INSERT\s+INTO/i)) {
            console.log(`✅ Datos insertados`)
          }
        } catch (error) {
          // Ignorar errores de "table already exists" o "duplicate entry"
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_ENTRY') {
            const tableMatch = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i)
            if (tableMatch) {
              console.log(`⚠️  Tabla ya existe: ${tableMatch[1]}`)
            } else {
              console.log(`⚠️  Ya existe: ${statement.substring(0, 50)}...`)
            }
          } else {
            console.error(`❌ Error en statement ${i + 1}:`, error.message)
            console.error(`Code: ${error.code}`)
            if (error.code !== 'ER_PARSE_ERROR') {
              console.error(`Statement: ${statement.substring(0, 150)}...`)
            }
          }
        }
      }
    }

    console.log('\n✅ Proceso completado!')
    console.log('\nVerificando tablas creadas...\n')

    // Verificar tablas creadas
    const [tables] = await connection.execute('SHOW TABLES')
    console.log(`📊 Tablas encontradas: ${tables.length}`)
    tables.forEach((table) => {
      const tableName = Object.values(table)[0]
      console.log(`   - ${tableName}`)
    })

    await connection.end()
    console.log('\n✅ Conexión cerrada')
  } catch (error) {
    console.error('❌ Error:', error.message)
    await connection.end()
    process.exit(1)
  }
}

createTables()

