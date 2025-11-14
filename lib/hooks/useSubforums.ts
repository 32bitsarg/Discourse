import useSWR from 'swr'
import { fetcher } from './useSWRConfig'

/**
 * Hook para obtener todas las comunidades
 */
export function useSubforums() {
  const { data, error, isLoading, mutate } = useSWR('/api/subforums', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
  })

  return {
    subforums: data?.subforums || [],
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook para obtener una comunidad por slug
 */
export function useSubforumBySlug(slug: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    slug ? `/api/subforums/by-slug/${slug}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos
    }
  )

  return {
    subforum: data?.subforum || null,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook para obtener comunidades del usuario
 */
export function useMyCommunities() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/subforums/my-communities',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos
    }
  )

  return {
    subforums: data?.subforums || [],
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook para obtener top comunidades
 */
export function useTopCommunities() {
  const { data, error, isLoading, mutate } = useSWR('/api/subforums/top', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
  })

  return {
    subforums: data?.subforums || [],
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook para obtener estado de membresía en una comunidad
 */
export function useMembershipStatus(subforumId: number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    subforumId ? `/api/subforums/${subforumId}/members/status` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos
    }
  )

  return {
    isMember: data?.isMember || false,
    status: data?.status || null,
    role: data?.role || null,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook para obtener solicitudes de una comunidad (solo para admins/mods)
 */
export function useCommunityRequests(subforumId: number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    subforumId ? `/api/subforums/${subforumId}/requests` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto - las solicitudes pueden cambiar más frecuentemente
    }
  )

  return {
    requests: data?.requests || [],
    isLoading,
    isError: error,
    mutate,
  }
}
