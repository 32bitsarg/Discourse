'use client'

import { motion } from 'framer-motion'
import { Home, TrendingUp, Zap, Clock, Users, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'

interface FilterTabsProps {
  onFilterChange?: (filter: string) => void
}

export default function FilterTabs({ onFilterChange }: FilterTabsProps) {
  const { t } = useI18n()
  const [activeFilter, setActiveFilter] = useState('all')

  const filters = [
    { id: 'for-you', name: t.post.forYou, icon: Sparkles },
    { id: 'all', name: t.post.all, icon: Home },
    { id: 'following', name: t.post.following, icon: Users },
    { id: 'hot', name: t.post.trends, icon: TrendingUp },
    { id: 'new', name: t.post.new, icon: Zap },
    { id: 'top', name: t.post.top, icon: Clock },
  ]

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(activeFilter)
    }
  }, [activeFilter, onFilterChange])

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-1.5 sm:p-2 flex gap-1 sm:gap-2 overflow-x-auto">
      {filters.map((filter) => {
        const Icon = filter.icon
        const isActive = activeFilter === filter.id
        return (
          <motion.button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
          </motion.button>
        )
      })}
    </div>
  )
}

