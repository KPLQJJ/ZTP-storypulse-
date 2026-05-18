import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useNovel, useDeleteNovel, useDeleteChapter, useUpdateNovel } from '@/features/novels/hooks'
import { chaptersApi } from '@/infrastructure/api/chapters-api'
import { useQueryClient } from '@tanstack/react-query'
import { useToastStore } from '@/infrastructure/stores/toast-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChapterDetailSheet } from '@/features/novels/components/ChapterDetailSheet'

import { NOVEL_STATUS_MAP } from '@/core/domain/constants'
import { formatWordCount, formatDate } from '@/core/domain/utils'
import {
  ArrowLeft,
  Upload,
  FolderOpen,
  FileText,
  Trash2,
  Sparkles,
  Clock,
  BarChart3,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Pencil,
  FileUp,
  Save,
  X,
} from 'lucide-react'

export default function NovelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const novelId = Number(id)
  const { data: novel, isLoading } = useNovel(novelId)
  const deleteNovel = useDeleteNovel()
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<'view' | 'edit'>('view')
  const [novelDeleteOpen, setNovelDeleteOpen] = useState(false)
  const [chapterDeleteOpen, setChapterDeleteOpen] = useState(false)
  const [chapterToDelete, setChapterToDelete] = useState<{ id: number; title: string } | null>(null)
  const deleteChapter = useDeleteChapter(novelId)
  const updateNovel = useUpdateNovel(novelId)

  // Description editing state
  const descFileInputRef = useRef<HTMLInputElement>(null)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descText, setDescText] = useState('')
  const [descUploading, setDescUploading] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-1" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-24" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">作品不存在或已被删除</p>
        <Link to="/novels">
          <Button variant="outline">返回作品列表</Button>
        </Link>
      </div>
    )
  }

  async function doUpload(files: File[]) {
    if (files.length === 0) return

    setUploading(true)
    setUploadError('')
    try {
      const result = await chaptersApi.uploadBatch(novelId, files)
      queryClient.invalidateQueries({ queryKey: ['novels', novelId] })
      addToast('success', `成功上传 ${result.chapters.length} 个章节`)
      if (result.errors.length > 0) {
        setUploadError(result.errors.join('；'))
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    doUpload(files)
  }

  function handleFolderUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const allFiles = Array.from(e.target.files ?? [])
    e.target.value = ''
    // 按目录路径排序，保持文件夹内的自然顺序
    const files = allFiles
      .filter((f) => /\.(txt|md)$/i.test(f.name))
      .sort((a, b) => (a as any).webkitRelativePath?.localeCompare?.((b as any).webkitRelativePath) ?? 0)
    if (files.length === 0) {
      setUploadError('文件夹中没有找到 .txt 或 .md 文件')
      return
    }
    doUpload(files)
  }

  function handleDeleteNovel() {
    deleteNovel.mutate(novelId, { onSuccess: () => setNovelDeleteOpen(false) })
  }

  function handleDeleteChapter(chapterId: number, title: string) {
    setChapterToDelete({ id: chapterId, title })
    setChapterDeleteOpen(true)
  }

  function confirmDeleteChapter() {
    if (!chapterToDelete) return
    deleteChapter.mutate(chapterToDelete.id, {
      onSuccess: () => {
        setChapterDeleteOpen(false)
        setChapterToDelete(null)
      },
    })
  }

  function openChapterSheet(chapterId: number, mode: 'view' | 'edit') {
    setSelectedChapterId(chapterId)
    setSheetMode(mode)
    setSheetOpen(true)
  }

  function startEditDesc() {
    setDescText(novel?.description ?? '')
    setEditingDesc(true)
  }

  function cancelEditDesc() {
    setEditingDesc(false)
    setDescText('')
  }

  function saveDesc() {
    updateNovel.mutate({ description: descText }, { onSuccess: () => setEditingDesc(false) })
  }

  function handleDescFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setDescUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      setDescText(reader.result as string)
      setEditingDesc(true)
      setDescUploading(false)
    }
    reader.onerror = () => {
      addToast('error', '文件读取失败')
      setDescUploading(false)
    }
    reader.readAsText(file)
  }

  return (
    <div>
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/novels"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回作品列表
        </Link>
        <div className="flex gap-2">
          <Link to={`/reviews/new?novel=${novelId}`}>
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              发起审稿
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setNovelDeleteOpen(true)}
            disabled={deleteNovel.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Novel info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{novel.title}</CardTitle>
              <CardDescription className="mt-1">
                <Badge variant="secondary">{novel.genre}</Badge>
                <span className="mx-2">·</span>
                <Badge variant="outline">{NOVEL_STATUS_MAP[novel.status]}</Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              总字数：{formatWordCount(novel.word_count)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              更新于 {formatDate(novel.updated_at)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {novel.chapters?.length || 0} 个章节
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Two-column: Description (left) + Upload Chapter (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left: Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">简介说明</CardTitle>
            <CardDescription>编辑作品简介，或从 .md / .txt 文件导入</CardDescription>
          </CardHeader>
          <CardContent>
            {editingDesc ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="desc-textarea" className="text-xs">简介内容</Label>
                  <Textarea
                    id="desc-textarea"
                    rows={5}
                    value={descText}
                    onChange={(e) => setDescText(e.target.value)}
                    placeholder="介绍你的作品..."
                    className="mt-1.5 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="brand"
                    className="gap-1.5"
                    onClick={saveDesc}
                    disabled={updateNovel.isPending}
                  >
                    <Save className="h-3.5 w-3.5" />
                    {updateNovel.isPending ? '保存中...' : '保存'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={cancelEditDesc}
                  >
                    <X className="h-3.5 w-3.5" />
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="min-h-[80px] rounded-lg border bg-muted/30 p-3">
                  {novel.description ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {novel.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">
                      暂无简介，点击下方按钮编辑或导入
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={startEditDesc}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    编辑简介
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={descUploading}
                    onClick={() => descFileInputRef.current?.click()}
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    {descUploading ? '导入中...' : '导入文件'}
                  </Button>
                  <input
                    ref={descFileInputRef}
                    type="file"
                    accept=".txt,.md"
                    onChange={handleDescFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Upload Chapter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">上传章节</CardTitle>
            <CardDescription>支持 .txt 和 .md 文件，单文件最大 10MB，可一次选择多个文件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  disabled={uploading}
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? '上传中...' : '选择文件'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  className="gap-2"
                  onClick={() => folderInputRef.current?.click()}
                >
                  <FolderOpen className="h-4 w-4" />
                  {uploading ? '上传中...' : '选择文件夹'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  // @ts-expect-error webkitdirectory is widely supported
                  webkitdirectory=""
                  multiple
                  onChange={handleFolderUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
              {uploadError && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {uploadError}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chapter list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">章节列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!novel.chapters?.length ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Upload className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">还没有章节</p>
              <p className="text-xs text-muted-foreground/60">上传第一个章节开始创作</p>
            </div>
          ) : (
            <div className="divide-y">
              {novel.chapters.map((ch) => (
                <div
                  key={ch.id}
                  className="chapter-row flex items-center justify-between px-6 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => openChapterSheet(ch.id, 'view')}
                >
                  <div>
                    <p className="text-sm font-medium">
                      第 {ch.chapter_index} 章 · {ch.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatWordCount(ch.word_count)} · {ch.file_format?.toUpperCase()} ·{' '}
                      {formatDate(ch.created_at)}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="chapter-menu-btn"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          openChapterSheet(ch.id, 'view')
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        查看
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          openChapterSheet(ch.id, 'edit')
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteChapter(ch.id, `第 ${ch.chapter_index} 章 · ${ch.title}`)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuItem disabled onSelect={(e) => e.preventDefault()}>
                            <Sparkles className="h-4 w-4" />
                            AI 润色
                          </DropdownMenuItem>
                        </TooltipTrigger>
                        <TooltipContent>即将上线</TooltipContent>
                      </Tooltip>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete novel dialog */}
      <Dialog open={novelDeleteOpen} onOpenChange={setNovelDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除作品</DialogTitle>
            <DialogDescription>
              确定要删除「{novel.title}」吗？此操作不可撤销，所有章节和数据将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovelDeleteOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteNovel}
              disabled={deleteNovel.isPending}
            >
              {deleteNovel.isPending ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete chapter dialog */}
      <Dialog open={chapterDeleteOpen} onOpenChange={setChapterDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除章节</DialogTitle>
            <DialogDescription>
              确定删除「{chapterToDelete?.title}」吗？此操作不可撤销，章节内容和字数统计将一并删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChapterDeleteOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteChapter}
              disabled={deleteChapter.isPending}
            >
              {deleteChapter.isPending ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chapter detail sheet */}
      <ChapterDetailSheet
        novelId={novelId}
        chapterId={selectedChapterId}
        mode={sheetMode}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) setSelectedChapterId(null)
        }}
      />
    </div>
  )
}
