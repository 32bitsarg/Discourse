'use client'

import { motion } from 'framer-motion'
import { Home, TrendingUp, Zap, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

const filters = [
  { id: 'all', name: 'Todo', icon: Home },
  { id: 'hot', name: 'Tendencias', icon: TrendingUp },
  { id: 'new', name: 'Nuevo', icon: Zap },
  { id: 'top', name: 'Top', icon: Clock },
]

interface FilterTabsProps {
  onFilterChange?: (filter: string) => void
}

export default function FilterTabs({ onFilterChange }: FilterTabsProps) {
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(activeFilter)
    }
  }, [activeFilter, onFilterChange])

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2 flex gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon
        const isActive = activeFilter === filter.id
        return (
          <motion.button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon className="w-4 h-4" />
            {filter.name}
          </motion.button>
        )
      })}
    </div>
  )
}

