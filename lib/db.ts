import mysql from 'mysql2/promise'

// Función para obtener la configuración de la base de datos
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

// Crear el pool con la configuración
const pool = mysql.createPool(getDbConfig())

export default pool

// Función helper para obtener una conexión del pool
export async function getConnection() {
  return pool
}

