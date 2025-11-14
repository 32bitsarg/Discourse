'use client'

export default function SkeletonUserProfile() {
  return (
    <div className="animate-pulse">
      {/* Banner */}
      <div className="h-48 bg-gray-200 rounded-t-lg"></div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6 -mt-16 relative">
        {/* Avatar */}
        <div className="w-24 h-24 bg-gray-200 rounded-full border-4 border-white absolute -top-12"></div>
        
        <div className="pt-16">
          {/* Name */}
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          
          {/* Bio */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 mb-4">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
      
      {/* Posts */}
      <div className="mt-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

