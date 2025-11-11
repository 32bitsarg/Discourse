'use client'

import { useState } from 'react'
import PostFeed from '@/components/PostFeed'
import CreatePostBox from '@/components/CreatePostBox'
import FilterTabs from '@/components/FilterTabs'
import { useI18n } from '@/lib/i18n/context'

export default function HotPage() {
  const { t } = useI18n()
  const [filter, setFilter] = useState('hot')

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🔥 {t.post.trends}</h1>
        <p className="text-gray-600 text-sm">{t.post.popularPosts}</p>
      </div>
      <FilterTabs onFilterChange={setFilter} />
      <CreatePostBox />
      <PostFeed filter="hot" />
    </div>
  )
}

