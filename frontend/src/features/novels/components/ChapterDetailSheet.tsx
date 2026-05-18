import { useState, useEffect, useRef, useCallback } from 'react'
import { useChapter, useUpdateChapter, useDeleteChapter } from '@/features/novels/hooks'
import { formatWordCount, formatDate } from '@/core/domain/utils'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Pencil, Trash2, Sparkles, AlertCircle, X } from 'lucide-react'

interface ChapterDetailSheetProps {
  novelId: number
  chapterId: number | null
  mode: 'view' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
}

function countWords(text: string): number {
  let count = 0
  for (const ch of text) {
    if (('一' <= ch && ch <= '鿿') || ('㐀' <= ch && ch <= '䶿')) {
      count++
    }
  }
  count += (text.match(/[a-zA-Z]+/g) ?? []).length
  return count
}

export function ChapterDetailSheet({
  novelId,
  chapterId,
  mode: initialMode,
  open,
  onOpenChange,
}: ChapterDetailSheetProps) {
  const { data: chapter, isLoading, isError } = useChapter(novelId, chapterId ?? 0)
  const updateChapter = useUpdateChapter(novelId)
  const deleteChapter = useDeleteChapter(novelId)

  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [origTitle, setOrigTitle] = useState('')
  const [origContent, setOrigContent] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const isDirty = editTitle !== origTitle || editContent !== origContent

  useEffect(() => {
    setMode(initialMode)
    setDeleteDialogOpen(false)
  }, [initialMode, chapterId])

  useEffect(() => {
    if (chapter) {
      setEditTitle(chapter.title)
      setEditContent(chapter.content)
      setOrigTitle(chapter.title)
      setOrigContent(chapter.content)
    }
  }, [chapter])

  useEffect(() => {
    if (mode === 'edit') {
      setTimeout(() => titleInputRef.current?.focus(), 100)
    }
  }, [mode])

  function handleClose(open: boolean) {
    if (!open && mode === 'edit' && isDirty) {
      if (!window.confirm('有未保存的修改，确定放弃吗？')) return
    }
    setMode('view')
    setDeleteDialogOpen(false)
    onOpenChange(open)
  }

  function switchToEdit() {
    setMode('edit')
  }

  function cancelEdit() {
    if (isDirty) {
      if (!window.confirm('有未保存的修改，确定放弃吗？')) return
    }
    setEditTitle(origTitle)
    setEditContent(origContent)
    setMode('view')
  }

  function handleSave() {
    if (!chapter || !isDirty) return
    const req: { title?: string; content?: string } = {}
    if (editTitle !== origTitle) req.title = editTitle
    if (editContent !== origContent) req.content = editContent
    updateChapter.mutate(
      { chapterId: chapter.id, req },
      {
        onSuccess: () => {
          setOrigTitle(editTitle)
          setOrigContent(editContent)
          setMode('view')
        },
      },
    )
  }

  function handleDelete() {
    if (!chapter) return
    deleteChapter.mutate(chapter.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        handleClose(false)
      },
    })
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && mode === 'edit') {
        e.preventDefault()
        handleSave()
      }
    },
    [mode, editTitle, editContent, origTitle, origContent, chapter],
  )

  return (
    <Sheet open={open && chapterId !== null} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl lg:max-w-2xl flex flex-col p-0"
        showCloseButton={false}
      >
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex-1 p-5 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <AlertCircle className="h-12 w-12 text-destructive/60" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">章节加载失败</p>
              <p className="text-xs text-muted-foreground mt-1">
                请检查网络连接后重试
              </p>
            </div>
          </div>
        )}

        {/* Chapter content */}
        {chapter && (
          <>
            {/* Custom header with close button */}
            <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground truncate">
                  {mode === 'view'
                    ? `第 ${chapter.chapter_index} 章 · ${chapter.title}`
                    : '编辑章节'}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatWordCount(
                    mode === 'view' ? chapter.word_count : countWords(editContent),
                  )}{' '}
                  字 · {chapter.file_format?.toUpperCase() ?? 'TXT'} · 更新于{' '}
                  {formatDate(chapter.updated_at)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleClose(false)}
                className="shrink-0 -mr-1 -mt-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
              {/* VIEW MODE */}
              {mode === 'view' && (
                <div className="px-5 py-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {chapter.content}
                  </div>
                </div>
              )}

              {/* EDIT MODE */}
              {mode === 'edit' && (
                <div className="flex flex-col gap-4 px-5 py-4" onKeyDown={handleKeyDown}>
                  <div>
                    <Label htmlFor="chapter-title">章节标题</Label>
                    <Input
                      id="chapter-title"
                      ref={titleInputRef}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="章节标题"
                      maxLength={200}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <Label htmlFor="chapter-content">章节内容</Label>
                    <Textarea
                      id="chapter-content"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 min-h-[360px] mt-1.5"
                      placeholder="章节内容..."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    字数：{countWords(editContent)} 字
                    {chapter.word_count !== countWords(editContent) && (
                      <span className="ml-1">(原 {chapter.word_count} 字)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Ctrl + Enter 快速保存
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
              {mode === 'view' ? (
                <div className="space-y-2.5">
                  <Button
                    variant="brand"
                    className="w-full gap-2"
                    onClick={switchToEdit}
                  >
                    <Pencil className="h-4 w-4" />
                    编辑章节
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 text-destructive hover:text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      删除
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" className="flex-1 gap-2" disabled>
                          <Sparkles className="h-4 w-4" />
                          AI 润色
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>即将上线</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <Button variant="outline" className="flex-1" onClick={cancelEdit}>
                    取消
                  </Button>
                  <Button
                    variant="brand"
                    className="flex-1"
                    onClick={handleSave}
                    disabled={updateChapter.isPending || !isDirty}
                  >
                    {updateChapter.isPending ? '保存中...' : '保存修改'}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>

      {/* Delete chapter dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除章节</DialogTitle>
            <DialogDescription>
              确定删除「第 {chapter?.chapter_index} 章 · {chapter?.title}」吗？此操作不可撤销，章节内容和字数统计将一并删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteChapter.isPending}
            >
              {deleteChapter.isPending ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
