import useSWR from 'swr'
import { fetcher } from './useSWRConfig'

/**
 * Hook para obtener conexiones sociales del usuario actual
 */
export function useSocialConnections() {
  const { data, error, isLoading, mutate } = useSWR('/api/social/connections', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
  })

  return {
    connections: data?.connections || [],
    isLoading,
    isError: error,
    mutate,
  }
}

