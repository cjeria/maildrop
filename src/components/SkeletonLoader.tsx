function Bar({ w = 'w-full', h = 'h-3' }: { w?: string; h?: string }) {
  return <div className={`skeleton-shimmer rounded ${w} ${h}`} />
}

export function SkeletonLoader() {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel skeleton */}
      <div className="flex flex-col w-[483px] shrink-0 border-r border-gray-200 bg-white overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-4 px-4 border-b border-gray-200 h-11 shrink-0">
          <Bar w="w-28" h="h-3" />
        </div>
        {/* Builder rows */}
        <div className="flex-1 p-4 space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Bar w="w-24" h="h-2.5" />
              <Bar w="w-full" h="h-10" />
            </div>
          ))}
          <div className="space-y-2 pt-2">
            <Bar w="w-20" h="h-2.5" />
            <Bar w="w-full" h="h-28" />
          </div>
        </div>
      </div>

      {/* Right panel skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header label */}
        <div className="flex items-center px-4 border-b border-gray-200 bg-white h-11 shrink-0">
          <Bar w="w-24" h="h-3" />
        </div>
        {/* Controls bar */}
        <div className="flex items-center gap-3 px-3 py-2 bg-white border-b border-gray-200 shrink-0">
          <Bar w="w-20" h="h-6" />
          <Bar w="w-20" h="h-6" />
          <Bar w="w-10" h="h-6" />
        </div>
        {/* Email preview area */}
        <div className="flex-1 bg-gray-100 p-6 flex justify-center">
          <div className="w-[600px] bg-white rounded space-y-4 p-6">
            <Bar w="w-full" h="h-32" />
            <Bar w="w-full" h="h-4" />
            <Bar w="w-4/5" h="h-4" />
            <Bar w="w-3/5" h="h-4" />
            <div className="pt-2 space-y-3">
              <Bar w="w-full" h="h-4" />
              <Bar w="w-full" h="h-4" />
              <Bar w="w-2/3" h="h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
