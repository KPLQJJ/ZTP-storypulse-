import type { WorldbuildingOut } from '@/core/api/types'

interface WorldbuildingListProps {
  entries: WorldbuildingOut[]
}

const CATEGORY_LABELS: Record<string, string> = {
  geography: '地理',
  history: '历史',
  culture: '文化',
  power_system: '力量体系',
  race: '种族',
  faction: '势力',
  other: '其他',
}

export function WorldbuildingList({ entries }: WorldbuildingListProps) {
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground p-4 text-center">暂无世界观设定</p>
  }

  const grouped = new Map<string, WorldbuildingOut[]>()
  for (const e of entries) {
    const cat = e.category || 'other'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(e)
  }

  return (
    <div className="space-y-3 py-2">
      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">
            {CATEGORY_LABELS[category] || category}
          </p>
          <div className="space-y-1">
            {items.map((entry) => (
              <div
                key={entry.id}
                className="p-2 rounded-lg border border-border/40 bg-white/80"
              >
                <p className="text-sm font-medium">{entry.title}</p>
                {entry.content && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{entry.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
