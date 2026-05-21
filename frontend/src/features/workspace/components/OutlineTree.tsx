import type { OutlineOut } from '@/core/api/types'

interface OutlineNodeProps {
  node: OutlineOut
  children: OutlineOut[]
  activeId: number | null
  onSelect: (id: number) => void
  depth?: number
}

function buildTree(outlines: OutlineOut[]): Map<number | null, OutlineOut[]> {
  const map = new Map<number | null, OutlineOut[]>()
  for (const o of outlines) {
    const parentKey = o.parent_id ?? null
    if (!map.has(parentKey)) map.set(parentKey, [])
    map.get(parentKey)!.push(o)
  }
  // Sort by sort_order
  for (const [key, items] of map) {
    items.sort((a, b) => a.sort_order - b.sort_order)
  }
  return map
}

function OutlineNode({ node, children, activeId, onSelect, depth = 0 }: OutlineNodeProps) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
          activeId === node.id
            ? 'bg-brand-100 text-brand-700 font-medium'
            : 'hover:bg-gray-100 text-foreground'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {node.title || '未命名节点'}
      </button>
      {children.length > 0 && (
        <div>
          {children.map((child) => (
            <OutlineNode
              key={child.id}
              node={child}
              children={buildTree([]).get(child.id) ?? []}
              activeId={activeId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface OutlineTreeProps {
  outlines: OutlineOut[]
  activeOutlineId?: number | null
  onSelectOutline?: (id: number) => void
}

export function OutlineTree({ outlines, activeOutlineId, onSelectOutline }: OutlineTreeProps) {
  if (!outlines.length) {
    return <p className="text-sm text-muted-foreground p-4 text-center">暂无大纲节点</p>
  }

  const tree = buildTree(outlines)
  const roots = tree.get(null) ?? []

  // Flatten all for single-level display when tree has only roots
  const hasNested = outlines.some((o) => o.parent_id != null)

  if (!hasNested) {
    return (
      <div className="space-y-0.5 py-1">
        {outlines
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelectOutline?.(o.id)}
              className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                activeOutlineId === o.id
                  ? 'bg-brand-100 text-brand-700 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              {o.title || '未命名节点'}
            </button>
          ))}
      </div>
    )
  }

  return (
    <div className="space-y-0.5 py-1">
      {roots.map((node) => {
        const nodeChildren = tree.get(node.id) ?? []
        return (
          <OutlineNode
            key={node.id}
            node={node}
            children={nodeChildren}
            activeId={activeOutlineId ?? null}
            onSelect={(id) => onSelectOutline?.(id)}
          />
        )
      })}
    </div>
  )
}
