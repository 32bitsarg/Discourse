import mysql from 'mysql2/promise'

// Lazy initialization: solo crear el pool cuando se use, no durante la importación
// Esto evita errores durante el build si las variables de entorno no están disponibles
let poolInstance: mysql.Pool | null = null

// Función para obtener la configuración de la base de datos
// Solo se ejecuta cuando realmente se necesita el pool
function getDbConfig() {
  // IMPORTANTE: Todas las credenciales deben venir de variables de entorno
  // Nunca hardcodear credenciales en el código
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    throw new Error('Faltan variables de entorno de base de datos. Verifica tu archivo .env.local')
  }

  return {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }
}

function getPool(): mysql.Pool {
  if (!poolInstance) {
    // Solo validar y crear el pool cuando realmente se necesita
    poolInstance = mysql.createPool(getDbConfig())
  }
  return poolInstance
}

// Exportar un Proxy que crea el pool solo cuando se accede a sus propiedades
// Esto permite que el código funcione durante el build sin requerir las variables
const pool = new Proxy({} as mysql.Pool, {
  get(_target, prop) {
    const actualPool = getPool()
    const value = actualPool[prop as keyof mysql.Pool]
    // Si es una función, bindearla al pool real
    if (typeof value === 'function') {
      return value.bind(actualPool)
    }
    return value
  }
})

export default pool

// Función helper para obtener una conexión del pool
export async function getConnection() {
  return pool
}

