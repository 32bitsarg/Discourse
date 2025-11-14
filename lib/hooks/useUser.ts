import useSWR from 'swr'
import { fetcher } from './useSWRConfig'

/**
 * Hook para obtener el usuario actual
 */
export function useUser() {
  const { data, error, isLoading, mutate } = useSWR('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos - el usuario no cambia frecuentemente
  })

  return {
    user: data?.user || null,
    isLoading,
    isError: error,
    mutate, // Para revalidar después de login/logout
  }
}

/**
 * Hook para obtener un perfil de usuario específico
 */
export function useUserProfile(username: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    username ? `/api/user/${username}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos
    }
  )

  return {
    user: data?.user || null,
    posts: data?.posts || [],
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook para verificar si el usuario actual es admin
 */
export function useIsAdmin() {
  const { data, error, isLoading } = useSWR('/api/admin/check', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos - el estado de admin no cambia frecuentemente
  })

  return {
    isAdmin: data?.isAdmin || false,
    isLoading,
    isError: error,
  }
}

/**
 * Hook para obtener el perfil completo del usuario actual (con stats, social links, etc.)
 */
export function useCurrentUserProfile() {
  const { data, error, isLoading, mutate } = useSWR('/api/user/profile', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutos
  })

  return {
    user: data?.user || null,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook para verificar si el usuario actual sigue a otro usuario
 */
export function useFollowStatus(username: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    username ? `/api/user/${username}/follow` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos
    }
  )

  return {
    following: data?.following || false,
    followers: data?.followers || 0,
    following_count: data?.following_count || 0,
    isLoading,
    isError: error,
    mutate,
  }
}
