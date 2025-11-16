import { SWRConfiguration } from 'swr'

/**
 * Configuración global de SWR
 * Define valores por defecto para todas las peticiones
 */
export const swrConfig: SWRConfiguration = {
  // Revalidar cuando la ventana recupera el foco (pero no inmediatamente)
  revalidateOnFocus: false,
  // Revalidar cuando se reconecta a internet
  revalidateOnReconnect: true,
  // Tiempo de deduplicación: evitar requests duplicados en 2 minutos
  dedupingInterval: 120000,
  // Revalidar automáticamente cada 5 minutos (solo si hay focus)
  refreshInterval: 0, // Deshabilitado por defecto, se puede activar por hook
  // Mantener datos en caché aunque el componente se desmonte
  keepPreviousData: true,
  // Retry en caso de error
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  // Comparador de datos removido - SWR usa comparación por defecto (deepEqual)
  // compare: (a, b) => JSON.stringify(a) === JSON.stringify(b), // Removido para evitar problemas de serialización en build
}

/**
 * Fetcher por defecto para SWR
 */
export const fetcher = async (url: string) => {
  try {
    const res = await fetch(url)
    
    // Para ciertas APIs, 401 es esperado y no debería lanzar error
    if (!res.ok) {
      // Para estas APIs, 401 significa "no autenticado" pero no es un error
      if (res.status === 401 && (
        url.includes('/api/admin/check') || 
        url.includes('/api/feed/following') ||
        url.includes('/api/settings')
      )) {
        // Intentar parsear la respuesta para obtener datos por defecto
        try {
          const errorData = await res.json()
          // Si la respuesta tiene datos, retornarlos
          if (errorData.isAdmin !== undefined) {
            return errorData
          }
          if (errorData.posts !== undefined) {
            return errorData
          }
          if (errorData.settings !== undefined) {
            return errorData
          }
        } catch {
          // Si no se puede parsear, retornar estructura por defecto
        }
        
        // Retornar estructura por defecto según la API
        if (url.includes('/api/admin/check')) {
          return { isAdmin: false }
        }
        if (url.includes('/api/feed/following')) {
          return { posts: [], hasMore: false, page: 1, total: 0 }
        }
        if (url.includes('/api/settings')) {
          return { settings: [] }
        }
      }
      
      // Para otros errores, intentar obtener el mensaje
      let errorMessage = 'Error desconocido'
      try {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || 'Error desconocido'
      } catch {
        errorMessage = `Error ${res.status}: ${res.statusText}`
      }
      
      const error = new Error(errorMessage)
      // @ts-ignore
      error.info = { message: errorMessage }
      // @ts-ignore
      error.status = res.status
      
      // Log error en producción también para debugging
      console.error(`[SWR Error] ${url}:`, {
        status: res.status,
        message: errorMessage,
      })
      
      throw error
    }
    const data = await res.json()
    
    // Validar que la respuesta tenga la estructura esperada
    if (url.includes('/api/posts') || url.includes('/api/feed')) {
      if (!data || typeof data !== 'object') {
        console.error(`[SWR] Respuesta inválida de ${url}:`, data)
        return { posts: [], hasMore: false, page: 1, total: 0 }
      }
      // Asegurar que posts sea un array
      if (!Array.isArray(data.posts)) {
        console.error(`[SWR] Posts no es un array en ${url}:`, data)
        return { ...data, posts: [], hasMore: false }
      }
    }
    
    // Debug en desarrollo
    if (process.env.NODE_ENV === 'development' && url.includes('/api/posts')) {
      console.log(`[SWR] ${url}:`, {
        postsCount: data?.posts?.length || 0,
        hasPagination: !!data?.pagination,
      })
    }
    
    return data
  } catch (error: any) {
    // Log error con más detalles - serializar el error correctamente
    const errorMessage = error?.message || String(error) || 'Error desconocido'
    const errorStatus = error?.status || 'N/A'
    
    console.error(`[SWR Fetcher Error] ${url}:`, {
      message: errorMessage,
      status: errorStatus,
      errorType: error?.constructor?.name || typeof error,
    })
    
    // Retornar estructura por defecto en lugar de lanzar error
    // Esto evita que SWR rompa el componente
    if (url.includes('/api/posts') || url.includes('/api/feed')) {
      return { posts: [], hasMore: false, page: 1, total: 0 }
    }
    
    // Para otras APIs, también retornar estructura por defecto si es posible
    if (url.includes('/api/settings')) {
      return { settings: [] }
    }
    
    if (url.includes('/api/admin/check')) {
      return { isAdmin: false }
    }
    
    // Para otros errores, retornar estructura vacía en lugar de lanzar
    // Esto previene que el ErrorBoundary capture errores de SWR
    return null
  }
}

