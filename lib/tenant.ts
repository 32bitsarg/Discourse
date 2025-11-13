import { cookies, headers } from 'next/headers'
import pool from './db'

export interface Tenant {
  id: number
  name: string
  slug: string
  custom_domain?: string
  owner_id: number
  plan_id: number
  status: 'active' | 'suspended' | 'trial' | 'expired'
  trial_ends_at?: Date
  db_name: string
  db_host?: string
  settings?: any
  metadata?: any
}

export interface SubscriptionPlan {
  id: number
  name: string
  display_name: string
  description?: string
  price_monthly: number
  price_yearly: number
  max_users?: number
  max_communities?: number
  max_storage_gb?: number
  custom_domain: boolean
  api_access: boolean
  priority_support: boolean
  features?: any[]
}

/**
 * Obtiene el tenant actual basado en el subdominio o dominio personalizado
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  try {
    const headersList = await headers()
    const host = headersList.get('host') || ''
    const hostWithoutPort = host.split(':')[0]
    
    // Obtener dominio principal
    const mainDomain = process.env.MAIN_DOMAIN || 'discourse.click'
    const isMainDomain = hostWithoutPort === mainDomain || 
                         hostWithoutPort === `www.${mainDomain}` ||
                         hostWithoutPort === 'localhost' ||
                         hostWithoutPort === '127.0.0.1'
    
    // Si es el dominio principal, NO retornar tenant (usar BD principal)
    if (isMainDomain) {
      return null
    }
    
    // Si estamos en desarrollo y es localhost, permitir especificar tenant por cookie
    if (process.env.NODE_ENV === 'development' && isMainDomain) {
      const cookieStore = await cookies()
      const devTenant = cookieStore.get('dev_tenant')?.value
      if (devTenant) {
        return getTenantBySlug(devTenant)
      }
    }
    
    // Si NO es dominio principal, es un subdominio o dominio personalizado
    const subdomain = extractSubdomain(host)
    
    if (subdomain) {
      // Es un subdominio (ej: mi-foro.discourse.click)
      return getTenantBySlug(subdomain)
    } else {
      // Podría ser un dominio personalizado (ej: mi-foro.com)
      return getTenantByCustomDomain(host)
    }
  } catch (error) {
    console.error('Error getting current tenant:', error)
    return null
  }
}

/**
 * Extrae el subdominio del host
 */
function extractSubdomain(host: string): string | null {
  // Remover puerto si existe
  const hostWithoutPort = host.split(':')[0]
  
  // Si es localhost, retornar null
  if (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    return null
  }
  
  const parts = hostWithoutPort.split('.')
  
  // Si tiene al menos 3 partes (subdomain.domain.com), retornar el subdominio
  if (parts.length >= 3) {
    return parts[0]
  }
  
  return null
}

/**
 * Obtiene un tenant por su slug
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, slug, custom_domain, owner_id, plan_id, status, 
       trial_ends_at, db_name, db_host, settings, metadata
       FROM tenants 
       WHERE slug = ? AND status = 'active'`,
      [slug]
    ) as any[]
    
    if (rows.length === 0) {
      return null
    }
    
    return mapRowToTenant(rows[0])
  } catch (error) {
    console.error('Error getting tenant by slug:', error)
    return null
  }
}

/**
 * Obtiene un tenant por su dominio personalizado
 */
export async function getTenantByCustomDomain(domain: string): Promise<Tenant | null> {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, slug, custom_domain, owner_id, plan_id, status, 
       trial_ends_at, db_name, db_host, settings, metadata
       FROM tenants 
       WHERE custom_domain = ? AND status = 'active'`,
      [domain]
    ) as any[]
    
    if (rows.length === 0) {
      return null
    }
    
    return mapRowToTenant(rows[0])
  } catch (error) {
    console.error('Error getting tenant by custom domain:', error)
    return null
  }
}

/**
 * Obtiene el tenant por defecto (para desarrollo)
 */
async function getDefaultTenant(): Promise<Tenant | null> {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, slug, custom_domain, owner_id, plan_id, status, 
       trial_ends_at, db_name, db_host, settings, metadata
       FROM tenants 
       WHERE status = 'active'
       ORDER BY id ASC
       LIMIT 1`
    ) as any[]
    
    if (rows.length === 0) {
      return null
    }
    
    return mapRowToTenant(rows[0])
  } catch (error) {
    console.error('Error getting default tenant:', error)
    return null
  }
}

/**
 * Mapea una fila de BD a un objeto Tenant
 */
function mapRowToTenant(row: any): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    custom_domain: row.custom_domain || undefined,
    owner_id: row.owner_id,
    plan_id: row.plan_id,
    status: row.status,
    trial_ends_at: row.trial_ends_at ? new Date(row.trial_ends_at) : undefined,
    db_name: row.db_name,
    db_host: row.db_host || undefined,
    settings: row.settings ? JSON.parse(row.settings) : undefined,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }
}

/**
 * Crea un nuevo tenant
 */
export async function createTenant(
  name: string,
  slug: string,
  ownerId: number,
  planId: number = 1, // Free plan por defecto
  customDomain?: string,
  ownerUsername?: string,
  ownerEmail?: string,
  ownerPasswordHash?: string
): Promise<Tenant> {
  // Verificar que el slug no exista
  const existing = await getTenantBySlug(slug)
  if (existing) {
    throw new Error('Este slug ya está en uso')
  }
  
  // Generar nombre de base de datos única
  const dbName = `tenant_${slug}_${Date.now()}`
  
  // Crear tenant en BD principal
  const [result] = await pool.execute(
    `INSERT INTO tenants (name, slug, custom_domain, owner_id, plan_id, db_name, status)
     VALUES (?, ?, ?, ?, ?, ?, 'trial')`,
    [name, slug, customDomain || null, ownerId, planId, dbName]
  ) as any[]
  
  // Crear base de datos del tenant e instalar esquema completo
  await createTenantDatabase(dbName, ownerUsername, ownerEmail, ownerPasswordHash)
  
  // Crear suscripción inicial
  await createInitialSubscription(result.insertId, planId)
  
  // Agregar owner como admin
  await pool.execute(
    `INSERT INTO tenant_admins (user_id, tenant_id, role)
     VALUES (?, ?, 'owner')`,
    [ownerId, result.insertId]
  )
  
  return getTenantBySlug(slug) as Promise<Tenant>
}

/**
 * Crea la base de datos del tenant e instala el esquema completo
 * Instalación automática tipo WordPress
 */
async function createTenantDatabase(
  dbName: string,
  ownerUsername?: string,
  ownerEmail?: string,
  ownerPasswordHash?: string
): Promise<void> {
  // Crear la base de datos
  await pool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
  
  // Instalar el esquema completo automáticamente
  const { installTenantDatabase } = await import('./tenant-installer')
  
  if (ownerUsername && ownerEmail && ownerPasswordHash) {
    // Instalar esquema y crear usuario owner
    await installTenantDatabase(dbName, ownerUsername, ownerEmail, ownerPasswordHash)
  } else {
    // Solo instalar esquema, sin usuario owner
    await installTenantDatabase(dbName, 'admin', 'admin@example.com', '')
  }
}

/**
 * Crea la suscripción inicial del tenant
 */
async function createInitialSubscription(tenantId: number, planId: number): Promise<void> {
  const now = new Date()
  const trialEnd = new Date(now)
  trialEnd.setDate(trialEnd.getDate() + 14) // 14 días de trial
  
  await pool.execute(
    `INSERT INTO subscriptions (tenant_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
     VALUES (?, ?, 'active', 'monthly', ?, ?)`,
    [tenantId, planId, now, trialEnd]
  )
  
  // Actualizar trial_ends_at del tenant
  await pool.execute(
    `UPDATE tenants SET trial_ends_at = ? WHERE id = ?`,
    [trialEnd, tenantId]
  )
}

/**
 * Obtiene el plan de suscripción
 */
export async function getSubscriptionPlan(planId: number): Promise<SubscriptionPlan | null> {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, display_name, description, price_monthly, price_yearly,
       max_users, max_communities, max_storage_gb, custom_domain, api_access,
       priority_support, features
       FROM subscription_plans
       WHERE id = ?`,
      [planId]
    ) as any[]
    
    if (rows.length === 0) {
      return null
    }
    
    const row = rows[0]
    return {
      id: row.id,
      name: row.name,
      display_name: row.display_name,
      description: row.description || undefined,
      price_monthly: parseFloat(row.price_monthly),
      price_yearly: parseFloat(row.price_yearly),
      max_users: row.max_users || undefined,
      max_communities: row.max_communities || undefined,
      max_storage_gb: row.max_storage_gb || undefined,
      custom_domain: Boolean(row.custom_domain),
      api_access: Boolean(row.api_access),
      priority_support: Boolean(row.priority_support),
      features: row.features ? JSON.parse(row.features) : undefined,
    }
  } catch (error) {
    console.error('Error getting subscription plan:', error)
    return null
  }
}

/**
 * Verifica si el tenant puede crear un recurso según su plan
 */
export async function checkTenantLimit(
  tenant: Tenant,
  resourceType: 'users' | 'communities' | 'storage',
  currentCount: number
): Promise<{ canCreate: boolean; current: number; max?: number }> {
  const plan = await getSubscriptionPlan(tenant.plan_id)
  if (!plan) {
    return { canCreate: false, current: currentCount }
  }
  
  let maxAllowed: number | undefined
  
  switch (resourceType) {
    case 'users':
      maxAllowed = plan.max_users
      break
    case 'communities':
      maxAllowed = plan.max_communities
      break
    case 'storage':
      maxAllowed = plan.max_storage_gb
      break
  }
  
  // Si maxAllowed es undefined o null, es ilimitado
  const canCreate = maxAllowed === undefined || maxAllowed === null || currentCount < maxAllowed
  
  return {
    canCreate,
    current: currentCount,
    max: maxAllowed,
  }
}

