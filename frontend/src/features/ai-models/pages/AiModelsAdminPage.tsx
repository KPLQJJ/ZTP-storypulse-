import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  useAdminAiModels,
  useCreateAiModel,
  useUpdateAiModel,
  useToggleAiModel,
  useDeleteAiModel,
} from '@/features/ai-models/hooks'
import { useApiProviders } from '@/features/api-providers/hooks'
import type { AiModelAdminOut, AiModelCreate, AiModelUpdate } from '@/core/api/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, Power, PowerOff, Cpu } from 'lucide-react'

interface ModelFormData {
  name: string
  provider: string
  model_id: string
  provider_id: number | null
  priority: number
  is_fallback: number
  capability_tags: string
  credits_per_1k_input: number
  credits_per_1k_output: number
}

const emptyForm: ModelFormData = {
  name: '',
  provider: '',
  model_id: '',
  provider_id: null,
  priority: 1,
  is_fallback: 0,
  capability_tags: '[]',
  credits_per_1k_input: 0,
  credits_per_1k_output: 0,
}

export default function AiModelsAdminPage() {
  const { data: models, isLoading } = useAdminAiModels()
  const { data: providers } = useApiProviders()
  const createModel = useCreateAiModel()
  const updateModel = useUpdateAiModel()
  const toggleModel = useToggleAiModel()
  const deleteModel = useDeleteAiModel()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<AiModelAdminOut | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AiModelAdminOut | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ModelFormData>({
    defaultValues: emptyForm,
  })

  function openCreate() {
    setEditingModel(null)
    reset(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(model: AiModelAdminOut) {
    setEditingModel(model)
    reset({
      name: model.name,
      provider: model.provider,
      model_id: model.model_id,
      provider_id: model.provider_id,
      priority: model.priority,
      is_fallback: model.is_fallback,
      capability_tags: model.capability_tags,
      credits_per_1k_input: model.credits_per_1k_input,
      credits_per_1k_output: model.credits_per_1k_output,
    })
    setDialogOpen(true)
  }

  function onSubmit(data: ModelFormData) {
    if (editingModel) {
      const req: AiModelUpdate = {}
      if (data.name !== editingModel.name) req.name = data.name
      if (data.provider !== editingModel.provider) req.provider = data.provider
      if (data.model_id !== editingModel.model_id) req.model_id = data.model_id
      if (data.provider_id !== editingModel.provider_id) req.provider_id = data.provider_id
      if (data.priority !== editingModel.priority) req.priority = data.priority
      if (data.is_fallback !== editingModel.is_fallback) req.is_fallback = data.is_fallback
      if (data.capability_tags !== editingModel.capability_tags) req.capability_tags = data.capability_tags
      if (data.credits_per_1k_input !== editingModel.credits_per_1k_input)
        req.credits_per_1k_input = data.credits_per_1k_input
      if (data.credits_per_1k_output !== editingModel.credits_per_1k_output)
        req.credits_per_1k_output = data.credits_per_1k_output
      updateModel.mutate(
        { id: editingModel.id, ...req },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      const req: AiModelCreate = { ...data }
      createModel.mutate(req, { onSuccess: () => setDialogOpen(false) })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">AI 模型管理</h1>
          <p className="text-muted-foreground mt-1">管理审稿可用的 AI 模型及其定价</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新建模型
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            模型列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-3 px-2 font-medium">名称</th>
                    <th className="py-3 px-2 font-medium">供应商</th>
                    <th className="py-3 px-2 font-medium">模型 ID</th>
                    <th className="py-3 px-2 font-medium text-center">优先级</th>
                    <th className="py-3 px-2 font-medium text-center">备用</th>
                    <th className="py-3 px-2 font-medium text-right">输入价格</th>
                    <th className="py-3 px-2 font-medium text-right">输出价格</th>
                    <th className="py-3 px-2 font-medium">状态</th>
                    <th className="py-3 px-2 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {models?.map((m) => (
                    <tr key={m.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 font-medium">{m.name}</td>
                      <td className="py-3 px-2 text-muted-foreground text-xs">{m.provider}</td>
                      <td className="py-3 px-2 font-mono text-xs text-muted-foreground">{m.model_id}</td>
                      <td className="py-3 px-2 text-center text-xs">{m.priority}</td>
                      <td className="py-3 px-2 text-center">
                        {m.is_fallback ? <Badge variant="secondary" className="text-xs">备用</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-xs">{m.credits_per_1k_input}</td>
                      <td className="py-3 px-2 text-right font-mono text-xs">{m.credits_per_1k_output}</td>
                      <td className="py-3 px-2">
                        <Badge variant={m.is_active === 1 ? 'default' : 'secondary'}>
                          {m.is_active === 1 ? '启用' : '停用'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              toggleModel.mutate({ id: m.id, isActive: m.is_active !== 1 })
                            }
                            title={m.is_active === 1 ? '停用' : '启用'}
                          >
                            {m.is_active === 1 ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(m)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(m)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {models?.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-muted-foreground">
                        暂无模型，点击「新建模型」添加
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModel ? '编辑模型' : '新建模型'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">模型名称</Label>
              <Input id="name" {...register('name', { required: '必填' })} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">供应商</Label>
              <Input id="provider" {...register('provider', { required: '必填' })} placeholder="如 DeepSeek, OpenAI" />
              {errors.provider && <p className="text-xs text-destructive">{errors.provider.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="model_id">模型 ID</Label>
              <Input id="model_id" {...register('model_id', { required: '必填' })} placeholder="如 deepseek-v4-pro" />
              {errors.model_id && <p className="text-xs text-destructive">{errors.model_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>关联平台</Label>
              <Select
                value={editingModel?.provider_id?.toString() || ''}
                onValueChange={(v) => {
                  /* handled via react-hook-form register, we need a hidden input */
                  const input = document.getElementById('provider_id') as HTMLInputElement
                  if (input) {
                    input.value = v || ''
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                      window.HTMLInputElement.prototype, 'value'
                    )?.set
                    nativeInputValueSetter?.call(input, v || '')
                    input.dispatchEvent(new Event('input', { bubbles: true }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="不关联 (兼容模式)" />
                </SelectTrigger>
                <SelectContent>
                  {(providers || []).map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.display_name} ({p.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                id="provider_id"
                type="hidden"
                {...register('provider_id', { valueAsNumber: true })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">优先级 (越小越优先)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  {...register('priority', { valueAsNumber: true, min: 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_fallback">备用标记</Label>
                <Select
                  value={editingModel?.is_fallback?.toString() || '0'}
                  onValueChange={(v) => {
                    const input = document.getElementById('is_fallback') as HTMLInputElement
                    if (input) {
                      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype, 'value'
                      )?.set
                      nativeInputValueSetter?.call(input, v)
                      input.dispatchEvent(new Event('input', { bubbles: true }))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">主力 (0)</SelectItem>
                    <SelectItem value="1">备用 (1)</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  id="is_fallback"
                  type="hidden"
                  {...register('is_fallback', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capability_tags">能力标签 (JSON)</Label>
              <Input
                id="capability_tags"
                placeholder='["creative","logic","fast"]'
                {...register('capability_tags')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="input_price">输入价格 (积分/1K tokens)</Label>
                <Input
                  id="input_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('credits_per_1k_input', { valueAsNumber: true, min: 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="output_price">输出价格 (积分/1K tokens)</Label>
                <Input
                  id="output_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('credits_per_1k_output', { valueAsNumber: true, min: 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createModel.isPending || updateModel.isPending}>
                {editingModel ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            确定要删除模型「{deleteTarget?.name}」吗？此操作不可撤销。如有审稿记录引用了此模型，删除将被拒绝。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={deleteModel.isPending}
              onClick={() =>
                deleteModel.mutate(deleteTarget!.id, {
                  onSuccess: () => setDeleteTarget(null),
                })
              }
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
