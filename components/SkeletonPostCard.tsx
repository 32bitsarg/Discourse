'use client'

export default function SkeletonPostCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          
          {/* Title */}
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          
          {/* Content */}
          <div className="space-y-2 mb-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

