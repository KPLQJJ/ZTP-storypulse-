import { useState, useEffect } from 'react'
import { Plus, Trash2, Sparkles, PenLine, FileText, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAiModels } from '@/features/ai-models/hooks'
import { useNovels } from '@/features/novels/hooks'
import {
  useModelPreferences,
  useUpsertModelPreference,
  useDeleteModelPreference,
} from '@/features/model-preferences/hooks'
import type { ApplicationType } from '@/core/api/types'

const APP_TYPES: { key: ApplicationType; label: string; icon: typeof Sparkles; description: string; recommend: string }[] = [
  {
    key: 'review',
    label: 'AI 审稿',
    icon: Sparkles,
    description: '七维诊断审稿',
    recommend: '推荐：DeepSeek-V4 Flash，性价比最高',
  },
  {
    key: 'polish',
    label: 'AI 润色',
    icon: PenLine,
    description: '文笔润色优化',
    recommend: '推荐：Qwen3-235B，中文文学能力第一梯队',
  },
  {
    key: 'writing',
    label: 'AI 创作',
    icon: FileText,
    description: '辅助内容创作',
    recommend: '推荐：DeepSeek-V4 Flash，快速生成 + 性价比',
  },
]

export default function ModelPreferencesPage() {
  const { data: models, isLoading: modelsLoading } = useAiModels()
  const { data: novelsPage, isLoading: novelsLoading } = useNovels()
  const novels = novelsPage || []
  const { data: preferences } = useModelPreferences()
  const upsertPref = useUpsertModelPreference()
  const deletePref = useDeleteModelPreference()

  const [globalSelections, setGlobalSelections] = useState<Record<string, number>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedNovelId, setSelectedNovelId] = useState<number | null>(null)
  const [novelSelections, setNovelSelections] = useState<Record<string, number>>({})

  // Pre-fill global defaults from existing preferences
  useEffect(() => {
    if (preferences) {
      const globals: Record<string, number> = {}
      for (const p of preferences) {
        if (p.novel_id === null) {
          globals[p.application_type] = p.model_id
        }
      }
      setGlobalSelections((prev) => ({ ...prev, ...globals }))
    }
  }, [preferences])

  const perNovelPrefs = (preferences || []).filter((p) => p.novel_id !== null)

  function getModelLabel(id: number) {
    const m = models?.find((x) => x.id === id)
    return m ? `${m.name} (${m.provider})` : '未知模型'
  }

  function handleSaveGlobal(appType: string) {
    const modelId = globalSelections[appType]
    if (!modelId) return
    upsertPref.mutate({ application_type: appType as ApplicationType, model_id: modelId })
  }

function handleSaveNovel() {
    if (!selectedNovelId) return
    for (const [appType, modelId] of Object.entries(novelSelections)) {
      if (modelId) {
        upsertPref.mutate({
          application_type: appType as ApplicationType,
          model_id: modelId,
          novel_id: selectedNovelId,
        })
      }
    }
    setDialogOpen(false)
    setSelectedNovelId(null)
    setNovelSelections({})
  }

  function openNovelDialog() {
    setSelectedNovelId(null)
    setNovelSelections({})
    setDialogOpen(true)
  }

  if (modelsLoading || novelsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI 模型设置</h1>
        <p className="text-muted-foreground mt-1">
          配置在不同应用场景下默认使用的 AI 模型。可为特定作品单独设置，未设置时使用全局默认。
        </p>
      </div>

      {/* ── Global Defaults ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">全局默认</CardTitle>
          <CardDescription>应用于所有未单独设置的作品</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {APP_TYPES.map((app) => (
            <div key={app.key} className="flex items-center gap-4 p-3 rounded-lg border">
              <app.icon className="h-5 w-5 text-brand-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{app.label}</p>
                <p className="text-xs text-muted-foreground">{app.recommend}</p>
              </div>
              <Select
                value={globalSelections[app.key]?.toString() || ''}
                onValueChange={(v) =>
                  setGlobalSelections((prev) => ({ ...prev, [app.key]: Number(v) }))
                }
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {(models || []).map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name} ({m.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveGlobal(app.key)}
                disabled={upsertPref.isPending}
              >
                保存
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Per-Novel Overrides ────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">作品单独设置</CardTitle>
            <CardDescription>为特定作品指定不同于全局默认的模型</CardDescription>
          </div>
          <Button size="sm" onClick={openNovelDialog}>
            <Plus className="h-4 w-4 mr-1" />
            添加设置
          </Button>
        </CardHeader>
        <CardContent>
          {perNovelPrefs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              暂无作品单独设置，点击"添加设置"为特定作品配置
            </p>
          ) : (
            <div className="space-y-3">
              {perNovelPrefs.map((pref) => (
                <div key={pref.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {novels?.find((n) => n.id === pref.novel_id)?.title || `作品 #${pref.novel_id}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {APP_TYPES.find((a) => a.key === pref.application_type)?.label}
                      </Badge>
                      <ArrowRight className="h-3 w-3" />
                      <span>{getModelLabel(pref.model_id)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deletePref.mutate(pref.id)}
                    disabled={deletePref.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Novel Override Dialog ──────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加作品模型设置</DialogTitle>
            <DialogDescription>
              为特定作品指定不同于全局默认的模型偏好
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>选择作品</Label>
              <Select
                value={selectedNovelId?.toString() || ''}
                onValueChange={(v) => setSelectedNovelId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择作品..." />
                </SelectTrigger>
                <SelectContent>
                  {(novels || []).map((n) => (
                    <SelectItem key={n.id} value={n.id.toString()}>
                      {n.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {APP_TYPES.map((app) => (
              <div key={app.key} className="space-y-2">
                <Label className="flex items-center gap-2">
                  <app.icon className="h-4 w-4" />
                  {app.label}
                </Label>
                <Select
                  value={novelSelections[app.key]?.toString() || globalSelections[app.key]?.toString() || ''}
                  onValueChange={(v) =>
                    setNovelSelections((prev) => ({ ...prev, [app.key]: Number(v) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="继承全局默认" />
                  </SelectTrigger>
                  <SelectContent>
                    {(models || []).map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name} ({m.provider})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveNovel} disabled={!selectedNovelId || upsertPref.isPending}>
              保存设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
