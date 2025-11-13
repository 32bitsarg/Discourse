import mysql from 'mysql2/promise'
import { getCurrentTenant, Tenant } from './tenant'

// Pool de conexiones para la BD principal (donde están los tenants)
const mainPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // BD principal
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Cache de pools por tenant
const tenantPools = new Map<string, mysql.Pool>()

/**
 * Obtiene el pool de conexiones para el tenant actual
 */
export async function getTenantPool(): Promise<mysql.Pool> {
  const tenant = await getCurrentTenant()
  
  if (!tenant) {
    // Si no hay tenant, usar BD principal (modo legacy o desarrollo)
    return mainPool
  }
  
  // Si el tenant tiene un host personalizado, crear conexión a ese host
  if (tenant.db_host) {
    const cacheKey = `${tenant.db_host}_${tenant.db_name}`
    
    if (!tenantPools.has(cacheKey)) {
      tenantPools.set(cacheKey, mysql.createPool({
        host: tenant.db_host,
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: tenant.db_name,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      }))
    }
    
    return tenantPools.get(cacheKey)!
  }
  
  // Si no tiene host personalizado, usar el mismo host pero BD diferente
  const cacheKey = tenant.db_name
  
  if (!tenantPools.has(cacheKey)) {
    tenantPools.set(cacheKey, mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: tenant.db_name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    }))
  }
  
  return tenantPools.get(cacheKey)!
}

/**
 * Obtiene el pool de conexiones para un tenant específico
 */
export function getTenantPoolById(tenant: Tenant): mysql.Pool {
  const cacheKey = tenant.db_host 
    ? `${tenant.db_host}_${tenant.db_name}` 
    : tenant.db_name
  
  if (!tenantPools.has(cacheKey)) {
    tenantPools.set(cacheKey, mysql.createPool({
      host: tenant.db_host || process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: tenant.db_name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    }))
  }
  
  return tenantPools.get(cacheKey)!
}

/**
 * Obtiene el pool de la BD principal (para operaciones de tenants)
 */
export function getMainPool(): mysql.Pool {
  return mainPool
}

/**
 * Cierra todas las conexiones de pools de tenants
 */
export async function closeAllPools(): Promise<void> {
  await Promise.all(
    Array.from(tenantPools.values()).map(pool => pool.end())
  )
  await mainPool.end()
  tenantPools.clear()
}

// Exportar mainPool como default para compatibilidad con código existente
// En el futuro, deberíamos migrar todo a usar getTenantPool()
export default mainPool

