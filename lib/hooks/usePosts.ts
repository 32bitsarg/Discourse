import useSWR from 'swr'
import { fetcher } from './useSWRConfig'

interface UsePostsOptions {
  filter?: string
  subforumId?: number
  page?: number
  limit?: number
}

/**
 * Hook para obtener posts con caché y revalidación automática
 */
export function usePosts(options: UsePostsOptions = {}) {
  const { filter = 'all', subforumId, page = 1, limit = 10 } = options

  let url = `/api/posts?filter=${filter}&page=${page}&limit=${limit}`
  if (subforumId) {
    url += `&subforum_id=${subforumId}`
  }

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minuto
  })

  return {
    posts: data?.posts || [],
    pagination: data?.pagination || null,
    isLoading,
    isError: error,
    mutate, // Para revalidar manualmente
  }
}

/**
 * Hook para obtener un post específico
 */
export function usePost(postId: string | number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    postId ? `/api/posts/${postId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120000, // 2 minutos
    }
  )

  return {
    post: data || null,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook para obtener feed "For You"
 */
export function useForYouFeed(page: number = 1, limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/feed/for-you?page=${page}&limit=${limit}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    posts: data?.posts || [],
    hasMore: data?.hasMore || false,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook para obtener feed "Following"
 */
export function useFollowingFeed(page: number = 1, limit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/feed/following?page=${page}&limit=${limit}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    posts: data?.posts || [],
    hasMore: data?.hasMore || false,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook para obtener un post por slug y community slug
 */
export function usePostBySlug(communitySlug: string | null, postSlug: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    communitySlug && postSlug 
      ? `/api/posts/by-slug?community=${encodeURIComponent(communitySlug)}&slug=${encodeURIComponent(postSlug)}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120000, // 2 minutos
    }
  )

  return {
    post: data || null,
    isLoading,
    isError: error,
    mutate,
  }
}

