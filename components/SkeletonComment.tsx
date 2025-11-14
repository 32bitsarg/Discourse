'use client'

export default function SkeletonComment({ depth = 0 }: { depth?: number }) {
  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : ''} animate-pulse`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          
          {/* Content */}
          <div className="space-y-2 mb-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="h-6 bg-gray-200 rounded w-12"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

