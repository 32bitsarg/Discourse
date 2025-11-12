'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Users, User, FileText, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

interface SearchResult {
  type: 'community' | 'user' | 'post'
  id: number
  title?: string
  name?: string
  username?: string
  slug?: string
  content?: string
}

export default function SearchBar() {
  const { t } = useI18n()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (query.trim().length >= 2) {
      const debounceTimer = setTimeout(() => {
        performSearch(query.trim())
      }, 300)

      return () => clearTimeout(debounceTimer)
    } else {
      setResults([])
      setIsLoading(false)
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setResults(data.results || [])
      setIsOpen(true)
    } catch (error) {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false)
    setQuery('')
    if (result.type === 'community') {
      router.push(`/r/${result.slug}`)
    } else if (result.type === 'user') {
      router.push(`/user/${result.username}`)
    } else if (result.type === 'post') {
      router.push(`/post/${result.id}`)
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'community':
        return <Users className="w-4 h-4" />
      case 'user':
        return <User className="w-4 h-4" />
      case 'post':
        return <FileText className="w-4 h-4" />
      default:
        return <Search className="w-4 h-4" />
    }
  }

  const getResultLabel = (type: string) => {
    switch (type) {
      case 'community':
        return 'Comunidad'
      case 'user':
        return 'Usuario'
      case 'post':
        return 'Post'
      default:
        return ''
    }
  }

  return (
    <div className="relative flex-1 max-w-2xl mx-4" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || query.length >= 2) {
              setIsOpen(true)
            }
          }}
          placeholder="Buscar comunidades, usuarios o posts..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query.length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                <span className="ml-2 text-sm text-gray-600">Buscando...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <motion.div
                    key={`${result.type}-${result.id}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-primary-600">
                            {getResultLabel(result.type)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.title || result.name || result.username}
                        </p>
                        {result.content && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                            {result.content}
                          </p>
                        )}
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : query.length >= 2 && !isLoading ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No se encontraron resultados
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

