import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiProvidersApi } from '@/infrastructure/api/api-providers-api'
import { useToastStore } from '@/infrastructure/stores/toast-store'
import type { ApiProviderCreate, ApiProviderUpdate } from '@/core/api/types'

export function useApiProviders() {
  return useQuery({
    queryKey: ['admin', 'api-providers'],
    queryFn: () => apiProvidersApi.list(),
  })
}

export function useCreateApiProvider() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (req: ApiProviderCreate) => apiProvidersApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-providers'] })
      addToast('success', 'API 平台已创建')
    },
  })
}

export function useUpdateApiProvider() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: ({ id, ...req }: ApiProviderUpdate & { id: number }) =>
      apiProvidersApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-providers'] })
      addToast('success', 'API 平台已更新')
    },
  })
}

export function useDeleteApiProvider() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (id: number) => apiProvidersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'api-providers'] })
      addToast('success', 'API 平台已删除')
    },
  })
}

export function useTestApiProvider() {
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (id: number) => apiProvidersApi.test(id),
    onSuccess: (data) => {
      if (data.status === 'ok') {
        addToast('success', '连通性测试通过')
      } else {
        addToast('error', `测试异常: ${data.detail || data.error || '未知错误'}`)
      }
    },
    onError: (err: Error) => {
      addToast('error', `测试失败: ${err.message}`)
    },
  })
}
