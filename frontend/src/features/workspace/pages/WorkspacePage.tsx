import { useState, useMemo } from 'react'
import { useNovels, useDeleteNovel } from '@/features/novels/hooks'
import { useNovelGroups, useCreateNovelGroup } from '@/features/workspace/hooks'
import { NovelGrid } from '@/ui/components/NovelGrid'
import { CreationCards } from '@/ui/components/CreationCards'
import { GroupTabs } from '@/ui/components/GroupTabs'
import { AddWorksToGroupDialog } from '@/ui/components/AddWorksToGroupDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function WorkspacePage() {
  const { data: novels, isLoading } = useNovels()
  const { data: groups } = useNovelGroups()
  const createGroup = useCreateNovelGroup()
  const deleteNovel = useDeleteNovel()

  const [activeGroupId, setActiveGroupId] = useState<number | null>(null)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
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

  function handleCreateGroup() {
    if (!newGroupName.trim()) return
    createGroup.mutate(
      { name: newGroupName.trim() },
      { onSuccess: () => { setNewGroupName(''); setGroupDialogOpen(false) } },
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1
        className="text-[2.5rem] font-bold tracking-tight mb-2"
        style={{ textShadow: '0 2px 12px rgb(196 107 60 / 0.5)' }}
      >
        工作台
      </h1>
      <p className="text-muted-foreground mb-8">
        从这里开始你的创作之旅
      </p>

      {/* Creation entry cards */}
      <CreationCards className="mb-8" />

      {/* Group tabs + novel grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">我的作品</h2>
      </div>

      <GroupTabs
        groups={groups ?? []}
        activeGroupId={activeGroupId}
        onSelect={setActiveGroupId}
        onCreate={() => setGroupDialogOpen(true)}
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
      ) : novels && novels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <svg className="h-16 w-16 mb-4 text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-lg font-medium mb-1">还没有作品</p>
          <p className="text-sm mb-6">点击上方卡片，从零开始创作或导入半成品</p>
        </div>
      ) : (
        <NovelGrid novels={filteredNovels} emptyMessage="该分组下暂无作品" onDeleteNovel={(id) => deleteNovel.mutate(id)} />
      )}

      {/* Add works to group dialog */}
      {addWorksGroupId != null && (
        <AddWorksToGroupDialog
          open
          onClose={() => setAddWorksGroupId(null)}
          groupId={addWorksGroupId}
          groupName={addWorksGroupName}
          existingNovelIds={groupNovelIds}
        />
      )}

      {/* Create group dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>新建分组</DialogTitle>
            <DialogDescription>给分组起个名字</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="group-name">分组名称</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="例如：玄幻系列"
                maxLength={100}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
                取消
              </Button>
              <Button
                variant="brand"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || createGroup.isPending}
              >
                {createGroup.isPending ? '创建中...' : '创建'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
