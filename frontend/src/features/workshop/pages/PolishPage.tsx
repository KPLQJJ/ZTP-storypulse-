import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useNovel } from '@/features/novels/hooks'
import { useBreadcrumbTitle } from '@/ui/layout/BreadcrumbContext'
import { useAiModels } from '@/features/ai-models/hooks'
import { usePolishes, usePolish, useCreatePolish } from '@/features/polishes/hooks'
import { ThreePanelLayout } from '@/ui/components/ThreePanelLayout'
import { SelectableChapterList } from '@/features/workspace/components/SelectableChapterList'
import { AgentConfigDisplay } from '@/features/workspace/components/AgentConfigDisplay'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parsePolishResults, formatDate, formatCredits } from '@/core/domain/utils'
import type { PolishOut } from '@/core/api/types'
import {
  Paintbrush, Sparkles, Cpu, Coins, Hash, Clock, BookOpen, Wand2, ChevronRight, ListTree,
} from 'lucide-react'


export default function PolishPage() {
  const { id } = useParams<{ id: string }>()
  const novelId = Number(id)

  const { data: novel, isLoading: novelLoading } = useNovel(novelId)
  useBreadcrumbTitle(novel?.title)
  const { data: models, isLoading: modelsLoading } = useAiModels()
  const { data: polishes, isLoading: polishesLoading } = usePolishes(novelId)
  const createPolish = useCreatePolish()

  const [selectedChapters, setSelectedChapters] = useState<number[]>([])
  const [selectedModelId, setSelectedModelId] = useState<number>(0)
  const [detailId, setDetailId] = useState<number | null>(null)

  const { data: polishDetail, isLoading: detailLoading } = usePolish(detailId ?? 0)

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
    createPolish.mutate(
      {
        novelId,
        req: { chapter_ids: selectedChapters, polish_style: '', model_id: selectedModelId },
      },
      {
        onSuccess: (data) => { setDetailId(data.id); setSelectedChapters([]) },
      },
    )
  }

  const selectedWordCount = chapters
    .filter((c) => selectedChapters.includes(c.id))
    .reduce((sum, c) => sum + c.word_count, 0)

  const results = polishDetail ? parsePolishResults(polishDetail.polish_results) : []

  // ── Center ─────────────────────────────────────────────

  const centerContent = detailId ? (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-white/80 shrink-0">
        <button
          type="button"
          onClick={() => setDetailId(null)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 返回
        </button>
        <span className="text-sm font-medium">
          {polishDetail?.polish_style || 'AI'} 润色结果
        </span>
        {polishDetail && (
          <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{polishDetail.model_used ?? '未知'}</span>
            <span className="flex items-center gap-1"><Coins className="h-3 w-3" />{formatCredits(polishDetail.credits_cost ?? 0)}</span>
          </div>
        )}
      </div>
      <ScrollArea className="flex-1 p-4">
        {detailLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}><CardContent className="py-8"><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-32" /></CardContent></Card>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Paintbrush className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p>暂无润色结果数据</p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((ch) => (
              <Card key={ch.chapter_index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    第 {ch.chapter_index} 章 · {ch.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    {ch.changes_summary}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">原文</p>
                      <div className="rounded-lg bg-gray-50 p-4 text-sm whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                        {ch.original_text}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-brand-600 mb-2 uppercase tracking-wider">润色后</p>
                      <div className="rounded-lg bg-brand-50/30 border border-brand-100 p-4 text-sm whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                        {ch.polished_text}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  ) : (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border bg-white/80 shrink-0">
        <h2 className="text-lg font-semibold">AI 润色</h2>
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
            {/* Polish standard info */}
            {novel && (
              <div className="rounded-lg border border-brand-200 bg-brand-50/50 px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand-600 shrink-0" />
                  <span className="text-brand-800">
                    <span className="font-medium">编辑标准：</span>
                    通用编辑标准
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand-600/70 ml-6">
                  AI 将依据网文写作特征和编辑技法进行润色
                </p>
              </div>
            )}

            {/* Cost estimate */}
            {selectedChapters.length > 0 && selectedModelId > 0 && (
              <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
                已选 {selectedChapters.length} 个章节，共 {selectedWordCount.toLocaleString()} 字。
                预计消耗积分将根据所选章节总字数和模型定价计算。
              </div>
            )}

            {createPolish.error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {createPolish.error instanceof Error ? createPolish.error.message : '润色失败'}
              </p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={selectedChapters.length === 0 || selectedModelId === 0 || createPolish.isPending}
              variant="brand"
              className="w-full"
            >
              <Wand2 className="h-4 w-4 mr-1" />
              {createPolish.isPending ? 'AI 润色中...' : '开始 AI 润色'}
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  )

  // ── Right: Model + Agent Config ─────────────────────────

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

          {/* Agent config */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Agent 配置</h4>
            <AgentConfigDisplay novelId={novelId} />
          </div>
        </div>
      </ScrollArea>
    </div>
  )

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
            润色历史
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
            {polishesLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : !polishes?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Paintbrush className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-xs">暂无润色记录</p>
              </div>
            ) : (
              <div className="space-y-1">
                {polishes.map((p: PolishOut) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDetailId(p.id)}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                      detailId === p.id
                        ? 'bg-brand-50 border border-brand-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="brand" className="text-xs py-0">{p.polish_style || 'AI润色'}</Badge>
                      <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(p.created_at)}</span>
                      <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{p.input_word_count.toLocaleString()}字</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
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
