import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useNovel } from '@/features/novels/hooks'
import { useBreadcrumbTitle } from '@/ui/layout/BreadcrumbContext'
import { useCreateReview, useReviews } from '@/features/reviews/hooks'
import { useAiModels } from '@/features/ai-models/hooks'
import { ThreePanelLayout } from '@/ui/components/ThreePanelLayout'
import { SelectableChapterList } from '@/features/workspace/components/SelectableChapterList'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, parseReviewDimensions } from '@/core/domain/utils'
import {
  BookOpen, Cpu, ChevronRight, Sparkles, Star, Clock, ListTree,
} from 'lucide-react'

export default function ReviewNewPage() {
  const { id } = useParams<{ id: string }>()
  const novelId = Number(id)

  const { data: novel, isLoading: novelLoading } = useNovel(novelId)
  useBreadcrumbTitle(novel?.title)
  const { data: models, isLoading: modelsLoading } = useAiModels()
  const { data: reviews, isLoading: reviewsLoading } = useReviews(novelId)
  const createReview = useCreateReview()

  const [selectedChapters, setSelectedChapters] = useState<number[]>([])
  const [selectedModelId, setSelectedModelId] = useState<number>(0)

  const chapters = novel?.chapters ?? []

  useEffect(() => {
    const first = models?.[0]?.id
    if (first && selectedModelId === 0) setSelectedModelId(first)
  }, [models, selectedModelId])

  function toggleChapter(id: number) {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function selectAll() { setSelectedChapters(chapters.map((c) => c.id)) }
  function deselectAll() { setSelectedChapters([]) }

  function handleSubmit() {
    if (selectedChapters.length === 0 || selectedModelId === 0) return
    createReview.mutate({
      novelId,
      req: { chapter_ids: selectedChapters, model_id: selectedModelId },
    })
    setSelectedChapters([])
  }

  const selectedWordCount = chapters
    .filter((c) => selectedChapters.includes(c.id))
    .reduce((sum, c) => sum + c.word_count, 0)

  // ── Left: Dual-tab sidebar ──────────────────────────────

  const leftContent = (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="chapters" className="flex flex-col h-full">
        <TabsList className="shrink-0 mx-2 mt-2 grid grid-cols-2 h-9">
          <TabsTrigger value="chapters" className="text-xs gap-1">
            <ListTree className="h-3.5 w-3.5" />
            选择章节
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1">
            <Clock className="h-3.5 w-3.5" />
            审查历史
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chapters" className="flex-1 m-0 data-[state=inactive]:hidden">
          <div className="px-4 py-2 border-b border-border/40 shrink-0">
            {selectedChapters.length > 0 && (
              <p className="text-xs text-muted-foreground">
                已选 {selectedChapters.length} 章 · {selectedWordCount.toLocaleString()} 字
              </p>
            )}
          </div>
          <ScrollArea className="h-full px-3 py-2">
            <SelectableChapterList
              chapters={chapters}
              selectedIds={selectedChapters}
              onToggle={toggleChapter}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full p-2">
            {reviewsLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : !reviews?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-xs">暂无审稿记录</p>
              </div>
            ) : (
              <div className="space-y-1">
                {reviews.map((review) => {
                  const dimensions = parseReviewDimensions(review.dimensions)
                  return (
                    <Link
                      key={review.id}
                      to={`/reviews/${review.id}`}
                      className="block w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-sm font-bold">{review.overall_score}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {dimensions.slice(0, 3).map((d) => (
                          <Badge key={d.label} variant="secondary" className="text-xs py-0">
                            {d.label}: {d.score}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{review.model_used ?? '未知'}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(review.created_at)}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )

  // ── Center: Form ────────────────────────────────────────

  const centerContent = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border bg-white/80 shrink-0">
        <h2 className="text-lg font-semibold">发起 AI 审稿</h2>
        {novel && <p className="text-xs text-muted-foreground mt-0.5">{novel.title}</p>}
      </div>
      <ScrollArea className="flex-1 p-4">
        {novelLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-6 max-w-lg">
            {/* Review standard info */}
            {novel && (
              <div className="rounded-lg border border-brand-200 bg-brand-50/50 px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-600 shrink-0" />
                  <span className="text-brand-800">
                    <span className="font-medium">审稿标准：</span>
                    多维度综合审稿标准
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand-600/70 ml-6">
                  AI 将依据网文写作特征从七个维度进行全面诊断
                </p>
              </div>
            )}

            {/* Cost estimate */}
            {selectedChapters.length > 0 && selectedModelId > 0 && (
              <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
                已选 {selectedChapters.length} 个章节，共 {selectedWordCount.toLocaleString()} 字。
                将从七个维度进行全面诊断，预计消耗积分根据模型定价计算。
              </div>
            )}

            {createReview.error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {createReview.error instanceof Error ? createReview.error.message : '审稿失败'}
              </p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={selectedChapters.length === 0 || selectedModelId === 0 || createReview.isPending}
              variant="brand"
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {createReview.isPending ? 'AI 审稿中...' : '开始 AI 审稿'}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  )

  // ── Right: Model + History ──────────────────────────────

  const rightContent = (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Model selection */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">选择模型</Label>
            {modelsLoading ? (
              <Skeleton className="h-9 w-full mt-1.5" />
            ) : !models?.length ? (
              <p className="mt-1.5 text-xs text-muted-foreground">暂无可用模型</p>
            ) : (
              <Select
                value={selectedModelId ? String(selectedModelId) : ''}
                onValueChange={(v) => setSelectedModelId(Number(v))}
              >
                <SelectTrigger className="mt-1.5 h-8 text-xs">
                  <SelectValue placeholder="请选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name} ({m.provider})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Review history */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              审稿历史
            </h4>
            {reviewsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : !reviews?.length ? (
              <p className="text-xs text-muted-foreground py-4 text-center">暂无审稿记录</p>
            ) : (
              <div className="space-y-1">
                {reviews.map((review) => {
                  const dimensions = parseReviewDimensions(review.dimensions)
                  return (
                    <Link
                      key={review.id}
                      to={`/reviews/${review.id}`}
                      className="block w-full text-left p-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-sm font-bold">{review.overall_score}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dimensions.slice(0, 3).map((d) => (
                          <Badge key={d.label} variant="secondary" className="text-xs py-0">
                            {d.label}: {d.score}
                          </Badge>
                        ))}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <div className="-m-4 md:-m-6">
      <ThreePanelLayout
        left={leftContent}
        center={centerContent}
        right={rightContent}
      />
    </div>
  )
}
