import useSWR from 'swr'
import { fetcher } from './useSWRConfig'

/**
 * Hook para obtener comentarios de un post
 */
export function useComments(postId: string | number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    postId ? `/api/posts/${postId}/comments` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto - los comentarios cambian más frecuentemente
    }
  )

  return {
    comments: data?.comments || [],
    isLoading,
    isError: error,
    mutate, // Para revalidar después de crear/editar comentario
  }
}

