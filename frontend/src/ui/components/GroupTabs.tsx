import { cn } from '@/lib/utils'
import { Plus, FolderPlus } from 'lucide-react'

interface Group {
  id: number
  name: string
  sort_order: number
}

interface GroupTabsProps {
  groups: Group[]
  activeGroupId: number | null
  onSelect: (groupId: number | null) => void
  onCreate?: () => void
  onAddWorks?: (groupId: number) => void
  allCount?: number
  ungroupedCount?: number
  groupCounts?: Record<number, number>
  className?: string
}

export function GroupTabs({
  groups,
  activeGroupId,
  onSelect,
  onCreate,
  onAddWorks,
  allCount,
  ungroupedCount,
  groupCounts,
  className,
}: GroupTabsProps) {
  const activeGroup = groups.find((g) => g.id === activeGroupId)

  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto', className)}>
      {/* All tab */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          activeGroupId === null
            ? 'bg-brand-100 text-brand-700'
            : 'text-muted-foreground hover:text-foreground hover:bg-gray-100',
        )}
      >
        全部{allCount != null ? ` (${allCount})` : ''}
      </button>

      {/* Ungrouped tab */}
      <button
        type="button"
        onClick={() => onSelect(0)}
        className={cn(
          'shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          activeGroupId === 0
            ? 'bg-brand-100 text-brand-700'
            : 'text-muted-foreground hover:text-foreground hover:bg-gray-100',
        )}
      >
        未分类{ungroupedCount != null ? ` (${ungroupedCount})` : ''}
      </button>

      {groups.map((group) => {
        const count = groupCounts?.[group.id]
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelect(group.id)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeGroupId === group.id
                ? 'bg-brand-100 text-brand-700'
                : 'text-muted-foreground hover:text-foreground hover:bg-gray-100',
            )}
          >
            {group.name}{count != null ? ` (${count})` : ''}
          </button>
        )
      })}

      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          新建
        </button>
      )}

      {/* Add works button — only when a real group is selected */}
      {onAddWorks && activeGroupId != null && activeGroupId > 0 && activeGroup && (
        <button
          type="button"
          onClick={() => onAddWorks(activeGroupId)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors ml-2"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          添加作品
        </button>
      )}
    </div>
  )
}
