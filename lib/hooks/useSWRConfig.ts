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
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    // @ts-ignore
    error.info = await res.json()
    // @ts-ignore
    error.status = res.status
    throw error
  }
  return res.json()
}

