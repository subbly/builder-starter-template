import { Skeleton } from '@/components/ui/skeleton'

type LoadingProgressProps = {
  count?: number
}

export const LoadingProgress = ({ count = 6 }: LoadingProgressProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-xl grid grid-cols-1 gap-3 p-4"
        >
          <Skeleton className="aspect-[3/2] w-full" />
          <Skeleton className="h-5 w-3/4" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-9 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
