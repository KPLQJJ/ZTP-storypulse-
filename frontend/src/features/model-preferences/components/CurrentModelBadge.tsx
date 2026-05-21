import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useResolvedModelPreference } from '@/features/model-preferences/hooks'
import { cn } from '@/lib/utils'

interface Props {
  applicationType: 'review' | 'polish' | 'writing'
  novelId?: number
  className?: string
}

const LABELS: Record<string, string> = {
  review: '审稿',
  polish: '润色',
  writing: '创作',
}

export function CurrentModelBadge({ applicationType, novelId, className }: Props) {
  const navigate = useNavigate()
  const { data, isLoading } = useResolvedModelPreference(applicationType, novelId)

  if (isLoading || !data) return null

  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
      <span>
        当前默认{LABELS[applicationType]}：{data.model_name} ({data.provider})
      </span>
      <button
        type="button"
        onClick={() => navigate('/settings/models')}
        className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 transition-colors"
      >
        <Settings className="h-3 w-3" />
        修改
      </button>
    </div>
  )
}
