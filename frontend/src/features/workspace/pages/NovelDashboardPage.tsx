import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNovel, useUpdateNovel, useDeleteNovel } from '@/features/novels/hooks'
import { useBreadcrumbTitle } from '@/ui/layout/BreadcrumbContext'
import { useOutlines, useCharacters, useWorldbuilding } from '@/features/workspace/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TAGS_BY_KEY } from '@/core/domain/tags'
import { TagGrid } from '@/ui/components/TagGrid'
import {
  PenLine,
  Paintbrush,
  Sparkles,
  ArrowLeft,
  Trash2,
  Download,
  FileText,
  Users,
  Globe,
  GitBranch,
  Pencil,
  Check,
  X,
} from 'lucide-react'

export default function NovelDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const novelId = Number(id)

  const { data: novel, isLoading } = useNovel(novelId)
  useBreadcrumbTitle(novel?.title)
  const { data: outlines } = useOutlines(novelId)
  const { data: characters } = useCharacters(novelId)
  const { data: worldbuilding } = useWorldbuilding(novelId)
  const updateNovel = useUpdateNovel(novelId)
  const deleteNovel = useDeleteNovel()

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])

  const tags: string[] = (() => {
    try { return JSON.parse(novel?.tags ?? '[]') }
    catch { return [] }
  })()

  function startEditTitle() {
    setEditTitle(novel?.title ?? '')
    setIsEditingTitle(true)
  }

  function saveTitle() {
    if (editTitle.trim() && editTitle.trim() !== novel?.title) {
      updateNovel.mutate({ title: editTitle.trim() })
    }
    setIsEditingTitle(false)
  }

  function cancelEditTitle() {
    setIsEditingTitle(false)
  }

  function startEditDescription() {
    setEditDescription(novel?.description ?? '')
    setIsEditingDescription(true)
  }

  function saveDescription() {
    const newDesc = editDescription.trim()
    if (newDesc !== (novel?.description ?? '')) {
      updateNovel.mutate({ description: newDesc })
    }
    setIsEditingDescription(false)
  }

  function cancelEditDescription() {
    setIsEditingDescription(false)
  }

  function startEditTags() {
    setEditTags([...tags])
    setIsEditingTags(true)
  }

  function saveTags() {
    updateNovel.mutate({ tags: editTags })
    setIsEditingTags(false)
  }

  function cancelEditTags() {
    setIsEditingTags(false)
  }

  function toggleEditTag(tagKey: string) {
    setEditTags((prev) =>
      prev.includes(tagKey) ? prev.filter((k) => k !== tagKey) : [...prev, tagKey],
    )
  }

  function handleDelete() {
    if (!confirm(`确定要删除《${novel?.title}》吗？此操作不可撤销。`)) return
    deleteNovel.mutate(novelId)
  }

  const handleExport = async () => {
    const { novelsApi } = await import('@/infrastructure/api/novels-api')
    const data = await novelsApi.exportNovel(novelId)
    const blob = new Blob([data.text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-48 mb-6 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        作品不存在
      </div>
    )
  }

  const chaptersCount = novel.chapters?.length ?? 0

  const stats = [
    { label: '章节', value: chaptersCount, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: '大纲', value: outlines?.length ?? 0, icon: GitBranch, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: '角色', value: characters?.length ?? 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: '世界观', value: worldbuilding?.length ?? 0, icon: Globe, color: 'text-amber-600', bg: 'bg-amber-100' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/workspace')}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回工作台
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            导出
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            删除
          </Button>
        </div>
      </div>

      {/* Info card — inline editable */}
      <Card className="mb-6">
        <CardContent className="p-6 space-y-5">
          {/* Title */}
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={200}
                  className="text-2xl font-bold h-12"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle()
                    if (e.key === 'Escape') cancelEditTitle()
                  }}
                  onBlur={saveTitle}
                />
                <button
                  type="button"
                  onClick={saveTitle}
                  className="shrink-0 p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditTitle}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <h2 className="text-2xl font-bold">{novel.title}</h2>
                <button
                  type="button"
                  onClick={startEditTitle}
                  className="p-1 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">标签</span>
              {!isEditingTags && (
                <button
                  type="button"
                  onClick={startEditTags}
                  className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-gray-100 transition-all"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
            {isEditingTags ? (
              <div className="border rounded-xl bg-gray-50/50 p-4">
                <TagGrid selected={editTags} onToggle={toggleEditTag} />
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={cancelEditTags}>
                    取消
                  </Button>
                  <Button
                    variant="brand"
                    size="sm"
                    onClick={saveTags}
                    disabled={updateNovel.isPending}
                  >
                    {updateNovel.isPending ? '保存中...' : '保存标签'}
                  </Button>
                </div>
              </div>
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((key) => {
                  const tag = TAGS_BY_KEY[key]
                  return tag ? (
                    <span
                      key={key}
                      className="inline-flex items-center rounded-lg bg-brand-100 border border-brand-300 text-brand-700 px-2.5 py-1 text-sm font-medium"
                    >
                      {tag.label}
                    </span>
                  ) : (
                    <span
                      key={key}
                      className="inline-flex items-center rounded-lg bg-gray-100 border border-gray-200 text-gray-600 px-2.5 py-1 text-sm"
                    >
                      {key}
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">暂无标签，点击编辑图标添加</p>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-muted-foreground">作品简介</span>
              {!isEditingDescription && (
                <button
                  type="button"
                  onClick={startEditDescription}
                  className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-gray-100 transition-all"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
            {isEditingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={500}
                  className="min-h-[100px] resize-none"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{editDescription.length}/500</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={cancelEditDescription}>
                      取消
                    </Button>
                    <Button
                      variant="brand"
                      size="sm"
                      onClick={saveDescription}
                      disabled={updateNovel.isPending}
                    >
                      {updateNovel.isPending ? '保存中...' : '保存'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : novel.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{novel.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">暂无简介，点击编辑图标添加</p>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1 border-t">
            <span>{novel.word_count.toLocaleString()} 字</span>
            <span className="text-border">·</span>
            <span>{novel.status === 'ongoing' ? '连载中' : novel.status === 'completed' ? '已完结' : '草稿'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workshop action cards */}
      <h2 className="text-lg font-semibold mb-3">创作工坊</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className="hover:border-brand-300 transition-colors cursor-pointer"
          onClick={() => navigate(`/workspace/novel/${novel.id}/write`)}
        >
          <CardContent className="pt-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 mx-auto mb-3">
              <PenLine className="h-6 w-6" />
            </div>
            <h3 className="font-semibold">去创作</h3>
            <p className="text-xs text-muted-foreground mt-1">继续写作</p>
          </CardContent>
        </Card>

        <Card
          className="hover:border-brand-300 transition-colors cursor-pointer"
          onClick={() => navigate(`/workspace/novel/${novel.id}/polish`)}
        >
          <CardContent className="pt-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 mx-auto mb-3">
              <Paintbrush className="h-6 w-6" />
            </div>
            <h3 className="font-semibold">作品润色</h3>
            <p className="text-xs text-muted-foreground mt-1">AI 文字优化</p>
          </CardContent>
        </Card>

        <Card
          className="hover:border-brand-300 transition-colors cursor-pointer"
          onClick={() => navigate(`/workspace/novel/${novel.id}/review`)}
        >
          <CardContent className="pt-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 mx-auto mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-semibold">发起审稿</h3>
            <p className="text-xs text-muted-foreground mt-1">七维诊断</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
