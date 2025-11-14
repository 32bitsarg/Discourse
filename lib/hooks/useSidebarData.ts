import useSWR from 'swr'
import { fetcher } from './useSWRConfig'

/**
 * Hook para obtener todos los datos del sidebar de una vez
 * Optimizado para reducir requests
 */
export function useSidebarData() {
  const { data, error, isLoading, mutate } = useSWR('/api/sidebar-data', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minuto
  })

  return {
    user: data?.user || null,
    stats: data?.stats || { members: 0, postsToday: 0, subforums: 0 },
    topCommunities: data?.topCommunities || [],
    myCommunities: data?.myCommunities || [],
    isLoading,
    isError: error,
    mutate,
  }
}

