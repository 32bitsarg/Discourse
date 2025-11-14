import useSWR from 'swr'
import { fetcher } from './useSWRConfig'

/**
 * Hook para obtener intereses del usuario actual
 */
export function useUserInterests() {
  const { data, error, isLoading, mutate } = useSWR('/api/user/interests', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
  })

  return {
    interests: data?.interests || [],
    isLoading,
    isError: error,
    mutate,
  }
}

