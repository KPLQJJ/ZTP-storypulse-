import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNovels } from '@/features/novels/hooks'
import { useNovel } from '@/features/novels/hooks'
import { useCreateReview } from '@/features/reviews/hooks'
import { useAiModels } from '@/features/ai-models/hooks'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Check, FileText } from 'lucide-react'

export default function ReviewNewPage() {
  const [searchParams] = useSearchParams()
  const preselectedNovelId = searchParams.get('novel')
  const [selectedNovelId, setSelectedNovelId] = useState<number | null>(
    preselectedNovelId ? Number(preselectedNovelId) : null,
  )
  const [selectedChapters, setSelectedChapters] = useState<number[]>([])
  const [selectedModelId, setSelectedModelId] = useState<number>(0)

  const { data: novels } = useNovels()
  const { data: novel } = useNovel(selectedNovelId ?? 0)
  const { data: models, isLoading: modelsLoading } = useAiModels()
  const createReview = useCreateReview()

  // Don't fetch novel when none selected
  const novelData = selectedNovelId ? novel : null
  const navigate = useNavigate()

  // Auto-select first model when list loads
  const firstModelId = models?.[0]?.id
  if (firstModelId && selectedModelId === 0) {
    setSelectedModelId(firstModelId)
  }

  function toggleChapter(chapterId: number) {
    setSelectedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId],
    )
  }

  function handleSubmit() {
    if (!selectedNovelId || selectedChapters.length === 0 || selectedModelId === 0) return
    createReview.mutate({
      novelId: selectedNovelId,
      req: { chapter_ids: selectedChapters, model_id: selectedModelId },
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <Card>
        <CardHeader>
          <CardTitle>发起 AI 审稿</CardTitle>
          <CardDescription>
            选择作品和章节，AI 将从七个维度进行全面诊断
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Select novel */}
          {!preselectedNovelId && (
            <div>
              <Label>选择作品</Label>
              <Select
                value={selectedNovelId?.toString() ?? ''}
                onValueChange={(v) => {
                  setSelectedNovelId(v ? Number(v) : null)
                  setSelectedChapters([])
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="请选择作品" />
                </SelectTrigger>
                <SelectContent>
                  {novels?.map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>
                      {n.title} ({n.word_count} 字)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Select chapters */}
          {novelData && (
            <div>
              <Label>
                选择章节（已选 {selectedChapters.length} 个）
              </Label>
              {!novelData.chapters?.length ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  该作品还没有章节，请先上传章节
                </p>
              ) : (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {novelData.chapters.map((ch) => {
                    const isSelected = selectedChapters.includes(ch.id)
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-left transition-colors ${
                          isSelected
                            ? 'bg-brand-50 text-brand-700'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleChapter(ch.id)}
                      >
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isSelected
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>
                          第 {ch.chapter_index} 章 · {ch.title}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {ch.word_count} 字
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Select model */}
          <div>
            <Label>选择模型</Label>
            {modelsLoading ? (
              <Skeleton className="h-10 w-full mt-1.5" />
            ) : !models?.length ? (
              <p className="mt-1.5 text-sm text-muted-foreground">暂无可用模型</p>
            ) : (
              <Select
                value={selectedModelId ? String(selectedModelId) : ''}
                onValueChange={(v) => setSelectedModelId(Number(v))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="请选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name} ({m.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Cost estimate */}
          {selectedChapters.length > 0 && selectedModelId > 0 && (
            <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
              预计消耗积分将根据所选章节总字数和模型定价计算，实际扣减以 AI 返回 token 数为准
            </div>
          )}

          {createReview.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {createReview.error instanceof Error
                ? createReview.error.message
                : '审稿失败'}
            </p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!selectedNovelId || selectedChapters.length === 0 || selectedModelId === 0 || createReview.isPending}
            variant="brand" className="w-full"
          >
            {createReview.isPending ? 'AI 审稿中...' : '开始 AI 审稿'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
