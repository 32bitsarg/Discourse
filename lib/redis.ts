// Cliente Redis usando Upstash REST API (optimizado para serverless)
// Upstash es perfecto para Vercel porque usa REST API en lugar de conexiones persistentes

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// Cache en memoria para desarrollo (reduce comandos de Upstash)
const inMemoryCache = new Map<string, { value: any; expires: number }>()

// Limpiar cache en memoria cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, data] of inMemoryCache.entries()) {
      if (data.expires < now) {
        inMemoryCache.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

// Función helper para ejecutar comandos Redis vía Upstash REST API
export async function executeRedisCommand(command: string[]): Promise<any> {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  try {
    const response = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    })

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        const errorText = await response.text()
        console.warn('⚠️  Upstash Redis error:', response.status, errorText)
      }
      return null
    }

    const data = await response.json()
    return data.result
  } catch (error) {
    // Silenciar errores, continuar sin cache
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Upstash Redis error:', error)
    }
    return null
  }
}

// Función helper para obtener datos del cache
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    // OPTIMIZACIÓN: Usar cache en memoria primero (gratis, sin comandos Upstash)
    const memoryCache = inMemoryCache.get(key)
    if (memoryCache && memoryCache.expires > Date.now()) {
      return memoryCache.value as T
    }

    // Solo usar Upstash en producción o si está configurado
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      return null
    }

    // Comando: GET key (1 comando)
    const result = await executeRedisCommand(['GET', key])
    
    if (!result) {
      return null
    }

    const parsed = JSON.parse(result) as T
    
    // Guardar en cache en memoria también (para próximas requests)
    inMemoryCache.set(key, {
      value: parsed,
      expires: Date.now() + 60000 // 1 minuto en memoria
    })
    
    return parsed
  } catch (error) {
    // Si hay error, continuar sin cache
    return null
  }
}

// Función helper para guardar en cache
export async function setCache(key: string, value: any, ttl: number = 300): Promise<void> {
  try {
    // OPTIMIZACIÓN: Guardar en memoria primero (gratis, sin comandos Upstash)
    inMemoryCache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000)
    })

    // OPTIMIZACIÓN: Solo escribir a Upstash si el TTL es largo (más de 2 minutos)
    // Esto reduce writes significativamente - datos de corta duración solo en memoria
    if (ttl < 120) {
      // TTL corto: solo memoria, no Upstash (ahorra writes)
      return
    }

    // Solo usar Upstash en producción o si está configurado
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      return
    }

    // Comando: SETEX key ttl value (1 comando, solo para TTLs largos)
    const valueString = JSON.stringify(value)
    await executeRedisCommand(['SETEX', key, ttl.toString(), valueString])
  } catch (error) {
    // Si hay error, continuar sin cache
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Error en setCache:', error)
    }
  }
}

// Función helper para invalidar cache (patrón)
// Nota: Upstash REST API no soporta KEYS directamente, así que esta función es limitada
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      return
    }

    // Upstash REST API no soporta KEYS/SCAN directamente
    // Para invalidar por patrón, necesitaríamos mantener un registro de keys
    // Por ahora, esta función no hace nada - usar invalidateKeys para keys específicas
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  invalidateCache con patrón no soportado en Upstash REST. Usa invalidateKeys en su lugar.')
    }
  } catch (error) {
    // Si hay error, continuar sin cache
  }
}

// Función helper para invalidar múltiples keys específicas (más eficiente)
export async function invalidateKeys(keys: string[]): Promise<void> {
  try {
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN || keys.length === 0) {
      return
    }

    // Comando: DEL key1 key2 key3 ...
    await executeRedisCommand(['DEL', ...keys])
  } catch (error) {
    // Si hay error, continuar sin cache
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Error invalidando cache:', error)
    }
  }
}
