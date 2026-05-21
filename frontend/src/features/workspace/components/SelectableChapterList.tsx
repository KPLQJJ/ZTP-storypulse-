import { Check, FileText } from 'lucide-react'
import type { ChapterOut } from '@/core/api/types'

interface SelectableChapterListProps {
  chapters: ChapterOut[]
  selectedIds: number[]
  onToggle: (id: number) => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
}

export function SelectableChapterList({
  chapters,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: SelectableChapterListProps) {
  if (!chapters.length) {
    return <p className="text-sm text-muted-foreground p-4 text-center">暂无章节，请先导入作品</p>
  }

  const sorted = [...chapters].sort((a, b) => a.chapter_index - b.chapter_index)
  const allSelected = selectedIds.length === chapters.length

  return (
    <div>
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <span className="text-xs text-muted-foreground">
          已选 {selectedIds.length}/{chapters.length}
        </span>
        <button
          type="button"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-xs text-brand-600 hover:text-brand-700"
        >
          {allSelected ? '取消全选' : '全选'}
        </button>
      </div>
      <div className="space-y-0.5">
        {sorted.map((ch) => {
          const isSelected = selectedIds.includes(ch.id)
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => onToggle(ch.id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-left transition-colors ${
                isSelected ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'
              }`}
            >
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  isSelected
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-gray-300'
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">
                第{ch.chapter_index}章 {ch.title || '(无标题)'}
              </span>
              <span className="ml-auto text-xs text-muted-foreground shrink-0">
                {ch.word_count}字
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
