'use client'

import { motion } from 'framer-motion'
import { Home, TrendingUp, Zap, Clock, Users, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useUser } from '@/lib/hooks/useUser'

interface FilterTabsProps {
  onFilterChange?: (filter: string) => void
}

export default function FilterTabs({ onFilterChange }: FilterTabsProps) {
  const { t } = useI18n()
  const isMobile = useIsMobile()
  // OPTIMIZACIÓN: Usar SWR para obtener usuario
  const { user } = useUser()
  const [activeFilter, setActiveFilter] = useState('hot')
  const [prevFilter, setPrevFilter] = useState<string | null>(null)
  
  // Cambiar a 'for-you' cuando el usuario se autentica
  useEffect(() => {
    if (user && activeFilter === 'hot') {
      setActiveFilter('for-you')
    }
  }, [user])

  const allFilters = [
    { id: 'for-you', name: t.post.forYou, icon: Sparkles },
    { id: 'all', name: t.post.all, icon: Home },
    { id: 'following', name: t.post.following, icon: Users },
    { id: 'hot', name: t.post.trends, icon: TrendingUp },
    { id: 'new', name: t.post.new, icon: Zap },
    { id: 'top', name: t.post.top, icon: Clock },
  ]

  const mobileFilters = [
    { id: 'for-you', name: t.post.forYou, icon: Sparkles },
    { id: 'following', name: t.post.following, icon: Users },
    { id: 'hot', name: t.post.trends, icon: TrendingUp },
  ]

  const guestFilters = [
    { id: 'hot', name: t.post.trends, icon: TrendingUp },
    { id: 'all', name: t.post.all, icon: Home },
    { id: 'new', name: t.post.new, icon: Zap },
  ]

  const filters = !user ? guestFilters : (isMobile ? mobileFilters : allFilters)

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(activeFilter)
    }
  }, [activeFilter, onFilterChange])

  const handleFilterChange = (filterId: string) => {
    setPrevFilter(activeFilter)
    setActiveFilter(filterId)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-1.5 sm:p-2 flex gap-1 sm:gap-2 overflow-x-auto justify-center">
      {filters.map((filter) => {
        const Icon = filter.icon
        const isActive = activeFilter === filter.id
        return (
          <motion.button
            key={filter.id}
            onClick={() => handleFilterChange(filter.id)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 relative ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={false}
            animate={{
              scale: isActive ? 1.05 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
              duration: 0.3,
            }}
          >
            <motion.div
              className="flex items-center gap-1 sm:gap-2"
              animate={{
                x: isActive && prevFilter && prevFilter !== filter.id ? [0, -5, 0] : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{filter.name}</span>
              <span className="sm:hidden">
                {filter.id === 'hot' ? t.post.hot : 
                 filter.id === 'new' ? t.post.new : 
                 filter.id === 'for-you' ? t.post.forYou :
                 filter.id === 'following' ? t.post.following :
                 filter.name}
              </span>
            </motion.div>
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-primary-600 rounded-lg"
                layoutId="activeTab"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{ zIndex: -1 }}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

