import { NextRequest } from 'next/server'
import { getSetting } from './settings'
import { executeRedisCommand } from './redis'

/**
 * Obtiene la IP del cliente desde el request
 */
export function getClientIP(request: NextRequest): string {
  // Intentar obtener IP desde headers (si está detrás de proxy/load balancer)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for puede contener múltiples IPs, tomar la primera
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0] || 'unknown'
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback: usar 'unknown' si no se puede obtener la IP
  return 'unknown'
}

/**
 * Tipos de acciones que pueden tener rate limiting
 */
export type RateLimitAction = 
  | 'login'
  | 'register'
  | 'create_post'
  | 'create_comment'
  | 'vote'
  | 'create_community'
  | 'create_report'
  | 'general' // Para requests generales

/**
 * Límites por defecto por tipo de acción (requests por minuto)
 * Estos son los límites base, se pueden ajustar desde el dashboard
 */
const DEFAULT_LIMITS: Record<RateLimitAction, number> = {
  login: 5,              // 5 intentos de login por minuto
  register: 3,           // 3 registros por minuto
  create_post: 10,       // 10 posts por minuto
  create_comment: 20,    // 20 comentarios por minuto
  vote: 60,              // 60 votos por minuto
  create_community: 2,    // 2 comunidades por minuto
  create_report: 10,     // 10 reportes por minuto
  general: 60,           // 60 requests generales por minuto
}

/**
 * Obtiene el límite configurado desde el dashboard o usa el default
 */
async function getLimitForAction(action: RateLimitAction): Promise<number> {
  // Obtener límite general desde settings
  const generalLimit = await getSetting('rate_limit_per_minute')
  const generalLimitNum = parseInt(generalLimit || '60', 10)

  // Usar el límite específico de la acción o el general (el menor de los dos)
  const actionLimit = DEFAULT_LIMITS[action]
  return Math.min(actionLimit, generalLimitNum)
}

/**
 * Genera la key de Redis para el rate limit
 */
function getRateLimitKey(ip: string, action: RateLimitAction): string {
  return `rate_limit:${action}:${ip}`
}

/**
 * Verifica si el request excede el rate limit
 * @returns { allowed: boolean, remaining: number, resetAt: number, limit: number }
 */
export async function checkRateLimit(
  request: NextRequest,
  action: RateLimitAction = 'general'
): Promise<{
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}> {
  const ip = getClientIP(request)
  const limit = await getLimitForAction(action)
  const key = getRateLimitKey(ip, action)
  const windowSeconds = 60 // Ventana de 1 minuto

  try {
    // Usar INCR para incrementar el contador y obtener el valor actual
    // Si la key no existe, se crea con valor 1
    const current = await executeRedisCommand(['INCR', key])
    
    if (current === null) {
      // Si Redis no está disponible, permitir el request (fail open)
      // En producción deberías considerar fallar cerrado
      return {
        allowed: true,
        remaining: limit,
        resetAt: Date.now() + (windowSeconds * 1000),
        limit,
      }
    }

    // Si es la primera request en esta ventana, establecer TTL
    if (current === 1) {
      await executeRedisCommand(['EXPIRE', key, windowSeconds.toString()])
    }

    // Calcular tiempo de reset (ahora + windowSeconds)
    const ttl = await executeRedisCommand(['TTL', key])
    const resetAt = Date.now() + ((ttl || windowSeconds) * 1000)

    const remaining = Math.max(0, limit - current)

    return {
      allowed: current <= limit,
      remaining,
      resetAt,
      limit,
    }
  } catch (error) {
    console.error('Error verificando rate limit:', error)
    // En caso de error, permitir el request (fail open)
    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + (windowSeconds * 1000),
      limit,
    }
  }
}

/**
 * Helper para crear una respuesta de rate limit excedido
 */
export function createRateLimitResponse(
  remaining: number,
  resetAt: number,
  limit: number
) {
  const resetIn = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
  return {
    message: `Has excedido el límite de requests. Intenta de nuevo en ${resetIn} segundos.`,
    remaining,
    resetAt,
    limit,
    retryAfter: resetIn,
  }
}

