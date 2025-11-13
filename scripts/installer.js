/**
 * Instalador Interactivo para Self-Hosted
 * Ejecuta la configuración completa de Discourse
 */

const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const crypto = require('crypto')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function checkRequirements() {
  console.log('\n🔍 Verificando requisitos del sistema...\n')
  
  // Verificar Node.js
  const nodeVersion = process.version
  const nodeMajor = parseInt(nodeVersion.split('.')[0].substring(1))
  if (nodeMajor < 18) {
    console.error('❌ Node.js 18+ es requerido. Versión actual:', nodeVersion)
    process.exit(1)
  }
  console.log('✅ Node.js:', nodeVersion)
  
  // Verificar MySQL (intentando conectar)
  console.log('⏳ Verificando MySQL...')
  // Esto se verificará más adelante con las credenciales
  
  console.log('✅ Requisitos básicos cumplidos\n')
}

async function getDatabaseConfig() {
  console.log('📊 Configuración de Base de Datos\n')
  
  const dbHost = await question('Host de MySQL (default: localhost): ') || 'localhost'
  const dbPort = await question('Puerto de MySQL (default: 3306): ') || '3306'
  const dbUser = await question('Usuario de MySQL (default: root): ') || 'root'
  const dbPassword = await question('Contraseña de MySQL: ')
  const dbName = await question('Nombre de la base de datos (default: discourse): ') || 'discourse'
  
  return {
    host: dbHost,
    port: parseInt(dbPort),
    user: dbUser,
    password: dbPassword,
    database: dbName,
  }
}

async function testDatabaseConnection(config) {
  console.log('\n🔌 Probando conexión a MySQL...\n')
  
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
    })
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``)
    await connection.query(`USE \`${config.database}\``)
    await connection.end()
    
    console.log('✅ Conexión a MySQL exitosa\n')
    return true
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message)
    console.error('\nPor favor verifica:')
    console.error('1. MySQL está instalado y corriendo')
    console.error('2. Las credenciales son correctas')
    console.error('3. El usuario tiene permisos para crear bases de datos\n')
    return false
  }
}

async function getRedisConfig() {
  console.log('🔴 Configuración de Redis (Opcional)\n')
  
  const useRedis = await question('¿Usar Redis para cache? (s/n, default: n): ') || 'n'
  
  if (useRedis.toLowerCase() !== 's') {
    return null
  }
  
  const redisUrl = await question('URL de Upstash Redis (o Enter para omitir): ')
  const redisToken = await question('Token de Upstash Redis (o Enter para omitir): ')
  
  return {
    url: redisUrl || '',
    token: redisToken || '',
  }
}

function generateSessionSecret() {
  return crypto.randomBytes(32).toString('hex')
}

async function createEnvFile(dbConfig, redisConfig, sessionSecret) {
  console.log('\n📝 Creando archivo .env.local...\n')
  
  let envContent = `# Configuración de Base de Datos
DB_HOST=${dbConfig.host}
DB_PORT=${dbConfig.port}
DB_USER=${dbConfig.user}
DB_PASSWORD=${dbConfig.password}
DB_NAME=${dbConfig.database}

# Redis (Opcional)
`
  
  if (redisConfig && redisConfig.url) {
    envContent += `UPSTASH_REDIS_REST_URL=${redisConfig.url}
UPSTASH_REDIS_REST_TOKEN=${redisConfig.token || ''}
`
  } else {
    envContent += `# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
`
  }
  
  envContent += `
# Seguridad
SESSION_SECRET=${sessionSecret}

# Dominio Principal (para SaaS - opcional)
# MAIN_DOMAIN=discourse.click

# Entorno
NODE_ENV=production
`
  
  const envPath = path.join(process.cwd(), '.env.local')
  fs.writeFileSync(envPath, envContent)
  console.log('✅ Archivo .env.local creado\n')
}

async function createDatabaseTables(dbConfig) {
  console.log('🗄️  Creando tablas de la base de datos...\n')
  
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      multipleStatements: true,
    })
    
    // Leer el archivo database.sql
    const sqlPath = path.join(__dirname, '../lib/database.sql')
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No se encontró el archivo: ${sqlPath}`)
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Ejecutar el SQL
    await connection.query(sqlContent)
    await connection.end()
    
    console.log('✅ Tablas creadas exitosamente\n')
    return true
  } catch (error) {
    console.error('❌ Error creando tablas:', error.message)
    return false
  }
}

async function createAdminUser(dbConfig) {
  console.log('👤 Creando usuario administrador...\n')
  
  const createAdmin = await question('¿Crear usuario administrador ahora? (s/n, default: s): ') || 's'
  
  if (createAdmin.toLowerCase() !== 's') {
    console.log('⏭️  Omitiendo creación de admin. Puedes crearlo después desde la aplicación.\n')
    return
  }
  
  const bcrypt = require('bcryptjs')
  
  const username = await question('Username del administrador: ')
  if (!username) {
    console.log('⏭️  Username vacío, omitiendo creación de admin.\n')
    return
  }
  
  const email = await question('Email del administrador: ')
  if (!email) {
    console.log('⏭️  Email vacío, omitiendo creación de admin.\n')
    return
  }
  
  const password = await question('Contraseña del administrador: ')
  if (!password || password.length < 8) {
    console.log('⏭️  Contraseña inválida (mínimo 8 caracteres), omitiendo creación de admin.\n')
    return
  }
  
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
    })
    
    // Verificar si el usuario ya existe
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    )
    
    if (existing.length > 0) {
      console.log('⚠️  El usuario ya existe. Omitiendo creación.\n')
      await connection.end()
      return
    }
    
    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Crear usuario
    await connection.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    )
    
    await connection.end()
    
    console.log('✅ Usuario administrador creado exitosamente\n')
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error.message)
  }
}

async function verifyInstallation(dbConfig) {
  console.log('🔍 Verificando instalación...\n')
  
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
    })
    
    // Verificar que las tablas principales existen
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'users'"
    )
    
    if (tables.length === 0) {
      console.error('❌ La tabla users no existe. La instalación puede estar incompleta.\n')
      await connection.end()
      return false
    }
    
    await connection.end()
    console.log('✅ Instalación verificada correctamente\n')
    return true
  } catch (error) {
    console.error('❌ Error verificando instalación:', error.message)
    return false
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║                                                           ║')
  console.log('║        Discourse - Instalador Self-Hosted                ║')
  console.log('║                                                           ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')
  console.log('')
  
  try {
    // 1. Verificar requisitos
    await checkRequirements()
    
    // 2. Obtener configuración de BD
    const dbConfig = await getDatabaseConfig()
    
    // 3. Probar conexión
    const connected = await testDatabaseConnection(dbConfig)
    if (!connected) {
      console.log('❌ No se pudo conectar a MySQL. Abortando instalación.\n')
      rl.close()
      process.exit(1)
    }
    
    // 4. Obtener configuración de Redis
    const redisConfig = await getRedisConfig()
    
    // 5. Generar session secret
    const sessionSecret = generateSessionSecret()
    
    // 6. Crear archivo .env.local
    await createEnvFile(dbConfig, redisConfig, sessionSecret)
    
    // 7. Crear tablas
    const tablesCreated = await createDatabaseTables(dbConfig)
    if (!tablesCreated) {
      console.log('❌ No se pudieron crear las tablas. Abortando instalación.\n')
      rl.close()
      process.exit(1)
    }
    
    // 8. Crear usuario admin
    await createAdminUser(dbConfig)
    
    // 9. Verificar instalación
    const verified = await verifyInstallation(dbConfig)
    if (!verified) {
      console.log('⚠️  La instalación puede estar incompleta. Revisa los errores anteriores.\n')
    }
    
    // 10. Mostrar resumen
    console.log('╔═══════════════════════════════════════════════════════════╗')
    console.log('║                                                           ║')
    console.log('║              ✅ Instalación Completada                     ║')
    console.log('║                                                           ║')
    console.log('╚═══════════════════════════════════════════════════════════╝')
    console.log('')
    console.log('📋 Próximos pasos:')
    console.log('')
    console.log('1. Inicia el servidor de desarrollo:')
    console.log('   npm run dev')
    console.log('')
    console.log('2. O crea el build de producción:')
    console.log('   npm run build')
    console.log('   npm start')
    console.log('')
    console.log('3. Abre http://localhost:3000 en tu navegador')
    console.log('')
    console.log('📚 Documentación completa: /self-host')
    console.log('')
    
  } catch (error) {
    console.error('\n❌ Error durante la instalación:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    rl.close()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main()
}

module.exports = { main }

