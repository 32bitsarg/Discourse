import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { fetcher } from './useSWRConfig'

interface SearchResult {
  type: 'community' | 'user' | 'post'
  id: number
  title?: string
  name?: string
  username?: string
  slug?: string
  subforum_slug?: string
  content?: string
}

/**
 * Hook para búsquedas con debounce y SWR
 */
export function useSearch(query: string, minLength: number = 2) {
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce del query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const { data, error, isLoading } = useSWR<{ results: SearchResult[] }>(
    debouncedQuery.trim().length >= minLength 
      ? `/api/search?q=${encodeURIComponent(debouncedQuery.trim())}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
    }
  )

  return {
    results: data?.results || [],
    isLoading: isLoading && debouncedQuery.trim().length >= minLength,
    isError: error,
  }
}

