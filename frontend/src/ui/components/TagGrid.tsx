import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { TAG_CATEGORIES, POPULAR_TAGS, TAGS_BY_KEY } from '@/core/domain/tags'

interface TagGridProps {
  selected: string[]
  onToggle: (tagKey: string) => void
  className?: string
}

export function TagGrid({ selected, onToggle, className }: TagGridProps) {
  const selectedSet = new Set(selected)

  return (
    <div className={cn('space-y-6', className)}>
      {selected.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>已选</span>
          <span className="font-semibold text-brand-600">{selected.length}</span>
          <span>个标签</span>
        </div>
      )}

      {/* Popular tags first */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          热门标签
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {POPULAR_TAGS.map((tag) => (
            <TagChip
              key={tag.key}
              tag={tag}
              selected={selectedSet.has(tag.key)}
              onToggle={() => onToggle(tag.key)}
            />
          ))}
        </div>
      </div>

      {/* Category sections */}
      {TAG_CATEGORIES.slice(1).map((cat) => (
        <div key={cat.key}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {cat.label}
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {cat.tags.map((tag) => (
              <TagChip
                key={tag.key}
                tag={tag}
                selected={selectedSet.has(tag.key)}
                onToggle={() => onToggle(tag.key)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TagChip({
  tag,
  selected,
  onToggle,
}: {
  tag: { key: string; label: string }
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 cursor-pointer active:scale-95 select-none',
        selected
          ? 'bg-brand-100 border-2 border-brand-400 text-brand-700 shadow-sm shadow-brand-500/10'
          : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300',
      )}
    >
      {selected && <Check className="h-3 w-3 shrink-0 text-brand-600" />}
      <span className="whitespace-nowrap">{tag.label}</span>
    </button>
  )
}
