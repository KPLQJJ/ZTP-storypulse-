import { useAgentConfigs, useUpsertAgentConfig } from '@/features/workspace/hooks'
import { useAiModels } from '@/features/ai-models/hooks'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const ROLE_LABELS: Record<string, string> = {
  outline_writer: '大纲规划师',
  chapter_writer: '章节作家',
  world_builder: '世界观架构师',
  character_designer: '角色设计师',
  polisher: '润色师',
  reviewer: '审稿人',
}

const ROLE_COLORS: Record<string, string> = {
  outline_writer: 'bg-blue-100 text-blue-700',
  chapter_writer: 'bg-emerald-100 text-emerald-700',
  world_builder: 'bg-amber-100 text-amber-700',
  character_designer: 'bg-purple-100 text-purple-700',
  polisher: 'bg-pink-100 text-pink-700',
  reviewer: 'bg-cyan-100 text-cyan-700',
}

interface AgentConfigDisplayProps {
  novelId: number
}

export function AgentConfigDisplay({ novelId }: AgentConfigDisplayProps) {
  const { data: configs, isLoading: configsLoading } = useAgentConfigs(novelId)
  const { data: models, isLoading: modelsLoading } = useAiModels()
  const upsertConfig = useUpsertAgentConfig()

  const allRoles = Object.keys(ROLE_LABELS)
  const loading = configsLoading || modelsLoading

  if (loading) {
    return (
      <div className="space-y-2 py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const getModelLabel = (modelId: number) => {
    const m = models?.find((x) => x.id === modelId)
    return m ? `${m.name} (${m.provider})` : `模型 #${modelId}`
  }

  return (
    <div className="space-y-2 py-1">
      <p className="text-xs text-muted-foreground px-1 mb-2">
        为每个 Agent 角色绑定不同的 AI 模型，实现多模型协作
      </p>
      {allRoles.map((role) => {
        const config = configs?.find((c) => c.agent_role === role)
        return (
          <div
            key={role}
            className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-white/80 gap-2"
          >
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600'}`}>
              {ROLE_LABELS[role] || role}
            </span>
            <Select
              value={config ? String(config.model_id) : ''}
              onValueChange={(v) => {
                upsertConfig.mutate({
                  novelId,
                  req: { agent_role: role, model_id: Number(v) },
                })
              }}
            >
              <SelectTrigger className="h-7 text-xs min-w-0">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                {models?.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                )) ?? <SelectItem value="none" disabled>暂无模型</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        )
      })}
    </div>
  )
}
