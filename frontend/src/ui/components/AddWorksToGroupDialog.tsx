import { useState, useMemo } from 'react'
import { useNovels, useSetNovelGroup } from '@/features/novels/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { NovelOut } from '@/core/api/types'
import {
  X, Search, BookOpen, Hash, Plus, Check, FolderOpen,
} from 'lucide-react'

interface AddWorksToGroupDialogProps {
  open: boolean
  onClose: () => void
  groupId: number
  groupName: string
  existingNovelIds: number[]
}

export function AddWorksToGroupDialog({
  open,
  onClose,
  groupId,
  groupName,
  existingNovelIds,
}: AddWorksToGroupDialogProps) {
  const { data: allNovels, isLoading } = useNovels()
  const setNovelGroup = useSetNovelGroup()
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  if (!open) return null

  const available = useMemo(() => {
    if (!allNovels) return []
    const filtered = allNovels.filter((n) => !existingNovelIds.includes(n.id))
    if (!search.trim()) return filtered
    const q = search.toLowerCase()
    return filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(q),
    )
  }, [allNovels, existingNovelIds, search])

  const existingSet = new Set(existingNovelIds)

  function toggle(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleAdd() {
    if (selectedIds.size === 0) return
    let count = 0
    selectedIds.forEach((novelId) => {
      setNovelGroup.mutate(
        { novelId, groupId },
        { onSuccess: () => { count++; if (count === selectedIds.size) onClose() } },
      )
    })
    setSelectedIds(new Set())
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden ring-1 ring-black/5">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">添加作品到分组</h2>
              <p className="text-sm text-muted-foreground">
                将作品归入 <span className="font-semibold text-brand-600">{groupName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-8 py-4 border-b border-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索作品名称..."
              className="pl-10 h-11 text-base rounded-xl border-gray-200 focus-visible:ring-brand-500"
            />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-8 py-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : available.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground/15 mb-4" />
              <p className="text-lg font-medium mb-1">没有可添加的作品</p>
              <p className="text-sm">
                {search ? '没有匹配的作品' : '所有作品都已在此分组中'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {available.map((novel) => {
                const selected = selectedIds.has(novel.id)
                return (
                  <button
                    key={novel.id}
                    type="button"
                    onClick={() => toggle(novel.id)}
                    className={cn(
                      'relative text-left p-5 rounded-xl border-2 transition-all duration-200',
                      selected
                        ? 'border-brand-500 bg-brand-50/50 shadow-md shadow-brand-500/10 scale-[1.02]'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:scale-[1.01]',
                    )}
                  >
                    {/* Select indicator */}
                    <div
                      className={cn(
                        'absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all',
                        selected
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'border-gray-300 bg-white',
                      )}
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </div>

                    {/* Novel info */}
                    <div className="flex items-start gap-3 mb-3 pr-8">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-amber-100 text-brand-600 font-bold text-sm shadow-sm">
                        {novel.title.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{novel.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(novel.word_count ?? 0).toLocaleString()} 字
                        </p>
                      </div>
                    </div>

                    {/* Meta footer */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {(novel.word_count ?? 0).toLocaleString()} 字
                      </span>
                      {novel.status && (
                        <Badge variant="secondary" className="text-xs py-0 font-normal">
                          {novel.status === 'draft' ? '草稿' : novel.status === 'ongoing' ? '连载中' : '已完结'}
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Bottom bar */}
        <div className="shrink-0 flex items-center justify-between px-8 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `已选择 ${selectedIds.size} 个作品`
              : '点击作品卡片选择要添加的作品'}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-xl h-10 px-5">
              取消
            </Button>
            <Button
              onClick={handleAdd}
              disabled={selectedIds.size === 0 || setNovelGroup.isPending}
              variant="brand"
              className="rounded-xl h-10 px-6 gap-2"
            >
              <Plus className="h-4 w-4" />
              {setNovelGroup.isPending ? '添加中...' : `添加作品 (${selectedIds.size})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
