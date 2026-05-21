import { cn } from '@/lib/utils'
import { NovelCard } from './NovelCard'
import type { NovelOut } from '@/core/api/types'

interface NovelGridProps {
  novels: NovelOut[]
  baseHref?: string
  emptyMessage?: string
  onDeleteNovel?: (id: number) => void
  className?: string
}

export function NovelGrid({
  novels,
  baseHref,
  emptyMessage = '暂无作品',
  onDeleteNovel,
  className,
}: NovelGridProps) {
  if (!novels.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <svg className="h-16 w-16 mb-4 text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn(
      'grid gap-4',
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      className,
    )}>
      {novels.map((novel) => (
        <NovelCard
          key={novel.id}
          novel={novel}
          href={baseHref ? `${baseHref}/novel/${novel.id}` : undefined}
          onDelete={onDeleteNovel}
        />
      ))}
    </div>
  )
}
