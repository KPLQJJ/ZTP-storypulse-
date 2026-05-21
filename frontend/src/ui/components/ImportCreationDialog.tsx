import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TAGS_BY_KEY } from '@/core/domain/tags'
import { useCreateNovelV2, useImportNovel } from '@/features/novels/hooks'
import { TagGrid } from './TagGrid'
import { FileUploadZone } from './FileUploadZone'
import { X, Upload } from 'lucide-react'

interface ImportCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportCreationDialog({ open, onOpenChange }: ImportCreationDialogProps) {
  const [title, setTitle] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [importingIndex, setImportingIndex] = useState(-1)

  const createNovel = useCreateNovelV2()
  const importNovel = useImportNovel()

  const loading = createNovel.isPending || importNovel.isPending

  function reset() {
    setTitle('')
    setSelectedTags([])
    setDescription('')
    setFiles([])
    setImportingIndex(-1)
  }

  function toggleTag(tagKey: string) {
    setSelectedTags((prev) =>
      prev.includes(tagKey) ? prev.filter((k) => k !== tagKey) : [...prev, tagKey],
    )
  }

  function removeTag(tagKey: string) {
    setSelectedTags((prev) => prev.filter((k) => k !== tagKey))
  }

  async function importNext(novelId: number, idx: number) {
    if (idx >= files.length) {
      reset()
      onOpenChange(false)
      return
    }
    setImportingIndex(idx)
    importNovel.mutate(
      { novelId, file: files[idx] },
      {
        onSuccess: () => importNext(novelId, idx + 1),
        onError: () => importNext(novelId, idx + 1),
      },
    )
  }

  function handleSubmit() {
    if (!title.trim() || files.length === 0) return
    createNovel.mutate(
      {
        genre: '其他',
        title: title.trim(),
        description: description.trim(),
        source_type: 'import',
        tags: selectedTags,
      },
      {
        onSuccess: (data) => importNext(data.id, 0),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">导入半成品续作</DialogTitle>
              <DialogDescription>上传文件，AI 自动识别章节、提取角色和世界观</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-4 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="import-title" className="text-base font-semibold">作品名称</Label>
            <div className="relative mt-1.5">
              <Input
                id="import-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="为你的作品取一个名字..."
                maxLength={200}
                className="h-12 text-lg pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {title.length}/200
              </span>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label className="text-base font-semibold">上传半成品文件</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              支持 .txt / .md 格式，可选择多个文件或整个文件夹
            </p>
            <FileUploadZone files={files} onFilesChange={setFiles} />
          </div>

          {/* Tag Selection */}
          <div>
            <Label className="text-base font-semibold">作品标签</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              选择标签帮助AI更好地理解你的创作方向
            </p>

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedTags.map((key) => {
                  const tag = TAGS_BY_KEY[key]
                  return tag ? (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-100 border border-brand-300 text-brand-700 px-2.5 py-1 text-sm font-medium"
                    >
                      {tag.label}
                      <button
                        type="button"
                        onClick={() => removeTag(key)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-brand-200 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null
                })}
              </div>
            )}

            <div className="border rounded-xl bg-gray-50/50 p-4">
              <TagGrid selected={selectedTags} onToggle={toggleTag} />
            </div>
          </div>

          {/* Description (optional) */}
          <div>
            <Label htmlFor="import-desc" className="text-base font-semibold">
              补充说明
              <span className="text-sm font-normal text-muted-foreground ml-1">（可选）</span>
            </Label>
            <p className="text-sm text-muted-foreground mt-1 mb-1.5">
              补充介绍你的作品，或说明导入的文件结构
            </p>
            <div className="relative">
              <Textarea
                id="import-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简单描述你的故事背景和主要情节..."
                maxLength={500}
                className="min-h-[120px] resize-none text-base"
              />
              <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                {description.length}/500
              </span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t pt-4 flex justify-end gap-3 shrink-0">
          <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="brand"
            size="lg"
            onClick={handleSubmit}
            disabled={!title.trim() || files.length === 0 || loading}
          >
            {loading
              ? importingIndex >= 0
                ? `正在导入 ${importingIndex + 1}/${files.length}...`
                : '创建中...'
              : files.length > 0
                ? `导入并创建（${files.length} 个文件）`
                : '导入并创建'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
