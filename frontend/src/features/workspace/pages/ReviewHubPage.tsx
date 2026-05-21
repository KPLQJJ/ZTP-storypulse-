import { useState, useMemo } from 'react'
import { useNovels } from '@/features/novels/hooks'
import { useNovelGroups } from '@/features/workspace/hooks'
import { NovelGrid } from '@/ui/components/NovelGrid'
import { GroupTabs } from '@/ui/components/GroupTabs'
import { AddWorksToGroupDialog } from '@/ui/components/AddWorksToGroupDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles } from 'lucide-react'

export default function ReviewHubPage() {
  const { data: novels, isLoading } = useNovels()
  const { data: groups } = useNovelGroups()
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null)
  const [addWorksGroupId, setAddWorksGroupId] = useState<number | null>(null)

  const addWorksGroupName = useMemo(() => {
    if (addWorksGroupId == null) return ''
    return groups?.find((g) => g.id === addWorksGroupId)?.name ?? ''
  }, [groups, addWorksGroupId])

  const groupNovelIds = useMemo(() => {
    if (addWorksGroupId == null || !novels) return []
    return novels.filter((n) => n.group_id === addWorksGroupId).map((n) => n.id)
  }, [novels, addWorksGroupId])

  const { allCount, ungroupedCount, groupCounts } = useMemo(() => {
    if (!novels) return { allCount: 0, ungroupedCount: 0, groupCounts: {} as Record<number, number> }
    const gc: Record<number, number> = {}
    let ug = 0
    novels.forEach((n) => {
      if (n.group_id == null) ug++
      else gc[n.group_id] = (gc[n.group_id] || 0) + 1
    })
    return { allCount: novels.length, ungroupedCount: ug, groupCounts: gc }
  }, [novels])

  const filteredNovels = useMemo(() => {
    if (!novels) return []
    if (activeGroupId === null) return novels
    if (activeGroupId === 0) return novels.filter((n) => n.group_id === null)
    return novels.filter((n) => n.group_id === activeGroupId)
  }, [novels, activeGroupId])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="text-[2rem] font-bold tracking-tight">审稿</h1>
      </div>
      <p className="text-muted-foreground mb-8 ml-13">选择作品发起 AI 审稿，从七个维度获得专业诊断报告</p>

      <GroupTabs
        groups={groups ?? []}
        activeGroupId={activeGroupId}
        onSelect={setActiveGroupId}
        onAddWorks={(gid) => setAddWorksGroupId(gid)}
        allCount={allCount}
        ungroupedCount={ungroupedCount}
        groupCounts={groupCounts}
        className="mb-4"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : (
        <NovelGrid novels={filteredNovels} baseHref="/review" emptyMessage="暂无作品，先去工作台创建吧" />
      )}

      {addWorksGroupId != null && (
        <AddWorksToGroupDialog
          open
          onClose={() => setAddWorksGroupId(null)}
          groupId={addWorksGroupId}
          groupName={addWorksGroupName}
          existingNovelIds={groupNovelIds}
        />
      )}
    </div>
  )
}
