'use client'

import { useState } from 'react'
import ForumLayout from '@/components/ForumLayout'
import PostFeed from '@/components/PostFeed'
import CreatePostBox from '@/components/CreatePostBox'
import FilterTabs from '@/components/FilterTabs'

export default function NewPage() {
  const [filter, setFilter] = useState('new')

  return (
    <ForumLayout>
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">✨ Nuevo</h1>
          <p className="text-gray-600 text-sm">Los posts más recientes de la comunidad</p>
        </div>
        <FilterTabs onFilterChange={setFilter} />
        <CreatePostBox />
        <PostFeed filter="new" />
      </div>
    </ForumLayout>
  )
}

