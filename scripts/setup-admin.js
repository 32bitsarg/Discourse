/**
 * Script para crear/verificar usuario admin
 * 
 * Este script crea un usuario admin si no existe, o verifica
 * que los usuarios especificados en NEXT_PUBLIC_ADMINS existan.
 * 
 * Uso:
 *   node scripts/setup-admin.js
 */

require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

async function setupAdmin() {
  let connection = null

  try {
    // Verificar variables de entorno
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      throw new Error('Faltan variables de entorno de base de datos. Verifica tu archivo .env.local')
    }

    console.log('🔄 Configurando usuario admin...\n')

    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })

    console.log('✅ Conectado a la base de datos\n')

    // Verificar si NEXT_PUBLIC_ADMINS está configurado
    const adminIds = process.env.NEXT_PUBLIC_ADMINS
    if (adminIds) {
      console.log(`📋 Verificando usuarios admin desde NEXT_PUBLIC_ADMINS: ${adminIds}\n`)
      
      const ids = adminIds.split(',').map(id => id.trim()).filter(id => id.length > 0)
      
      let foundCount = 0
      for (const identifier of ids) {
        // Intentar primero como ID numérico
        const userId = parseInt(identifier)
        let users = []
        
        if (!isNaN(userId)) {
          // Buscar por ID
          [users] = await connection.query(
            'SELECT id, username, email FROM users WHERE id = ?',
            [userId]
          )
        }
        
        // Si no se encontró por ID, buscar por username
        if (users.length === 0) {
          [users] = await connection.query(
            'SELECT id, username, email FROM users WHERE username = ?',
            [identifier]
          )
        }

        if (users.length > 0) {
          const user = users[0]
          console.log(`✅ Usuario admin encontrado: ${user.username} (ID: ${user.id}, Email: ${user.email})`)
          foundCount++
        } else {
          console.log(`⚠️  Usuario "${identifier}" no encontrado (buscado como ID y username)`)
        }
      }
      
      console.log(`\n📊 Resumen: ${foundCount} de ${ids.length} usuarios admin encontrados\n`)
      
      if (foundCount === 0) {
        console.log('⚠️  ADVERTENCIA: Ningún usuario admin fue encontrado!')
        console.log('   Asegúrate de que los IDs en NEXT_PUBLIC_ADMINS correspondan a usuarios existentes.\n')
      }
    } else {
      console.log('⚠️  NEXT_PUBLIC_ADMINS no está configurado\n')
      console.log('💡 Para configurar admins, agrega a .env.local:')
      console.log('   NEXT_PUBLIC_ADMINS=1,2,3 (IDs de usuarios separados por comas)\n')
    }

    // Verificar si existe algún usuario en la BD
    const [allUsers] = await connection.query(
      'SELECT id, username, email FROM users ORDER BY id LIMIT 5'
    )

    if (allUsers.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos\n')
      console.log('💡 Para crear un usuario admin manualmente:')
      console.log('   1. Registra un usuario desde la interfaz web')
      console.log('   2. Obtén su ID de la base de datos')
      console.log('   3. Agrega NEXT_PUBLIC_ADMINS=<ID> a .env.local\n')
    } else {
      console.log('\n📋 Usuarios existentes en la base de datos:')
      allUsers.forEach(user => {
        console.log(`   - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`)
      })
      console.log('\n💡 Si quieres hacer admin a alguno de estos usuarios, agrega su ID a NEXT_PUBLIC_ADMINS en .env.local')
    }

    console.log('\n✨ Verificación completada!')
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message)
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

// Ejecutar setup
setupAdmin()

