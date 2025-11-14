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
    if (!res.ok) {
      const error = new Error('An error occurred while fetching the data.')
      // @ts-ignore
      error.info = await res.json().catch(() => ({ message: 'Error desconocido' }))
      // @ts-ignore
      error.status = res.status
      throw error
    }
    const data = await res.json()
    
    // Debug en desarrollo
    if (process.env.NODE_ENV === 'development' && url.includes('/api/posts')) {
      console.log(`[SWR] ${url}:`, {
        postsCount: data?.posts?.length || 0,
        hasPagination: !!data?.pagination,
      })
    }
    
    return data
  } catch (error) {
    // Log error en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error(`[SWR Error] ${url}:`, error)
    }
    throw error
  }
}

