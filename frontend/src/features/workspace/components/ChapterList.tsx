import type { ChapterOut } from '@/core/api/types'

interface ChapterListProps {
  chapters: ChapterOut[]
  activeChapterId?: number | null
  onSelectChapter?: (id: number) => void
}

export function ChapterList({ chapters, activeChapterId, onSelectChapter }: ChapterListProps) {
  if (!chapters.length) {
    return <p className="text-sm text-muted-foreground p-4 text-center">暂无章节</p>
  }

  return (
    <div className="space-y-0.5 py-1">
      {chapters
        .sort((a, b) => a.chapter_index - b.chapter_index)
        .map((ch) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => onSelectChapter?.(ch.id)}
            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
              activeChapterId === ch.id
                ? 'bg-brand-100 text-brand-700 font-medium'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="truncate">
                第{ch.chapter_index}章 {ch.title || '(无标题)'}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {ch.word_count}字
              </span>
            </div>
          </button>
        ))}
    </div>
  )
}
