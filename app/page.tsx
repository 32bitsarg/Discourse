'use client'

import { useState, useRef } from 'react'
import ForumLayout from '@/components/ForumLayout'
import PostFeed from '@/components/PostFeed'
import CreatePostBox from '@/components/CreatePostBox'
import FilterTabs from '@/components/FilterTabs'

export default function Home() {
  const [filter, setFilter] = useState('all')
  const postFeedRef = useRef<{ refresh: () => void }>(null)

  return (
    <ForumLayout>
      <div className="space-y-4">
        <FilterTabs onFilterChange={setFilter} />
        <CreatePostBox onPostCreated={() => {
          // Actualizar el feed sin recargar la página
          if (postFeedRef.current) {
            postFeedRef.current.refresh()
          }
        }} />
        <PostFeed ref={postFeedRef} filter={filter} />
      </div>
    </ForumLayout>
  )
}

