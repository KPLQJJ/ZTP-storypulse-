import { useState } from 'react'
import { Plus, Pencil, Trash2, Wifi } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useApiProviders,
  useCreateApiProvider,
  useUpdateApiProvider,
  useDeleteApiProvider,
  useTestApiProvider,
} from '@/features/api-providers/hooks'
import type { ApiProviderPublicOut } from '@/core/api/types'

export default function ApiProvidersAdminPage() {
  const { data: providers, isLoading } = useApiProviders()
  const createProvider = useCreateApiProvider()
  const updateProvider = useUpdateApiProvider()
  const deleteProvider = useDeleteApiProvider()
  const testProvider = useTestApiProvider()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ApiProviderPublicOut | null>(null)
  const [form, setForm] = useState({ name: '', display_name: '', base_url: '', api_key: '' })
  const [deleteConfirm, setDeleteConfirm] = useState<ApiProviderPublicOut | null>(null)

  function openCreate() {
    setEditingProvider(null)
    setForm({ name: '', display_name: '', base_url: '', api_key: '' })
    setDialogOpen(true)
  }

  function openEdit(p: ApiProviderPublicOut) {
    setEditingProvider(p)
    setForm({ name: p.name, display_name: p.display_name, base_url: p.base_url, api_key: '' })
    setDialogOpen(true)
  }

  function handleSave() {
    if (editingProvider) {
      updateProvider.mutate(
        { id: editingProvider.id, ...form },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      createProvider.mutate(form, { onSuccess: () => setDialogOpen(false) })
    }
  }

  function handleDelete() {
    if (!deleteConfirm) return
    deleteProvider.mutate(deleteConfirm.id, { onSuccess: () => setDeleteConfirm(null) })
  }

  function getHealthBadge(status: string) {
    switch (status) {
      case 'healthy':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">正常</Badge>
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">降级</Badge>
      case 'down':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">故障</Badge>
      default:
        return <Badge variant="secondary" className="text-muted-foreground">未知</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API 账号管理</h1>
          <p className="text-muted-foreground mt-1">
            管理各 AI 平台的 API Key 和连接配置
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          添加平台
        </Button>
      </div>

      {/* Info card */}
      <Card className="bg-brand-50 border-brand-200">
        <CardContent className="pt-4 text-sm text-brand-800">
          <p className="font-medium mb-2">安全提示</p>
          <ul className="list-disc list-inside space-y-1 text-brand-700">
            <li>API Key 使用 AES-256 加密存储，前端仅显示后4位</li>
            <li>删除平台前请先解除关联的模型（在"模型管理"中修改 provider_id）</li>
            <li>Key 变更后系统自动生效，无需重启</li>
          </ul>
        </CardContent>
      </Card>

      {/* Providers table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">已配置平台</CardTitle>
          <CardDescription>共 {providers?.length || 0} 个平台</CardDescription>
        </CardHeader>
        <CardContent>
          {!providers?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">暂无平台配置</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">名称</th>
                    <th className="py-2 pr-4 font-medium">API 地址</th>
                    <th className="py-2 pr-4 font-medium">Key</th>
                    <th className="py-2 pr-4 font-medium">状态</th>
                    <th className="py-2 pr-4 font-medium">健康</th>
                    <th className="py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{p.display_name}</p>
                        <p className="text-xs text-muted-foreground">{p.name}</p>
                      </td>
                      <td className="py-3 pr-4 text-xs font-mono">{p.base_url}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{p.api_key_masked}</td>
                      <td className="py-3 pr-4">
                        {p.is_active ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">启用</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500">停用</Badge>
                        )}
                      </td>
                      <td className="py-3 pr-4">{getHealthBadge(p.health_status)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => testProvider.mutate(p.id)}
                            disabled={testProvider.isPending}
                          >
                            <Wifi className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(p)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProvider ? '编辑平台' : '添加 API 平台'}</DialogTitle>
            <DialogDescription>
              {editingProvider ? '修改平台配置，API Key 留空表示不修改' : '添加新的 AI API 平台'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>平台标识 (name)</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="volcano / siliconflow / zhipu"
              />
            </div>
            <div className="space-y-1">
              <Label>显示名称</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="火山引擎"
              />
            </div>
            <div className="space-y-1">
              <Label>API 地址 (base_url)</Label>
              <Input
                value={form.base_url}
                onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                placeholder="https://api.example.com"
              />
            </div>
            <div className="space-y-1">
              <Label>
                API Key {editingProvider ? '(留空不修改)' : ''}
              </Label>
              <Input
                type="password"
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                placeholder="sk-..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={createProvider.isPending || updateProvider.isPending}>
              {editingProvider ? '保存修改' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              删除平台 "{deleteConfirm?.display_name}"？此操作不可撤销。如果有模型关联了此平台，删除将被拒绝。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteProvider.isPending}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
