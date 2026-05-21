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
import { useCreateNovelV2 } from '@/features/novels/hooks'
import { TagGrid } from './TagGrid'
import { X, PenLine } from 'lucide-react'

interface ScratchCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScratchCreationDialog({ open, onOpenChange }: ScratchCreationDialogProps) {
  const [title, setTitle] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [description, setDescription] = useState('')

  const createNovel = useCreateNovelV2()

  function reset() {
    setTitle('')
    setSelectedTags([])
    setDescription('')
  }

  function toggleTag(tagKey: string) {
    setSelectedTags((prev) =>
      prev.includes(tagKey) ? prev.filter((k) => k !== tagKey) : [...prev, tagKey],
    )
  }

  function removeTag(tagKey: string) {
    setSelectedTags((prev) => prev.filter((k) => k !== tagKey))
  }

  function handleSubmit() {
    if (!title.trim()) return
    createNovel.mutate(
      {
        title: title.trim(),
        genre: '其他',
        description: description.trim(),
        source_type: 'from_scratch',
        tags: selectedTags,
      },
      { onSuccess: () => { reset(); onOpenChange(false) } },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">从零开始创作</DialogTitle>
              <DialogDescription>选择标签帮助AI更好地理解你的创作方向</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-4 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="scratch-title" className="text-base font-semibold">作品名称</Label>
            <div className="relative mt-1.5">
              <Input
                id="scratch-title"
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

          {/* Tag Selection */}
          <div>
            <Label className="text-base font-semibold">作品标签</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-3">
              选择标签帮助AI更好地理解你的创作方向
            </p>

            {/* Selected tags preview */}
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

          {/* Description */}
          <div>
            <Label htmlFor="scratch-desc" className="text-base font-semibold">作品简介</Label>
            <p className="text-sm text-muted-foreground mt-1 mb-1.5">
              用一两句话描述你的故事核心，让AI更好地理解你的创作意图
            </p>
            <div className="relative">
              <Textarea
                id="scratch-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：一个现代社畜穿越到修真世界，靠996经验在修仙界卷出一片天..."
                maxLength={500}
                className="min-h-[140px] resize-none text-base"
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
            disabled={!title.trim() || createNovel.isPending}
          >
            {createNovel.isPending ? '创建中...' : '创建作品'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
