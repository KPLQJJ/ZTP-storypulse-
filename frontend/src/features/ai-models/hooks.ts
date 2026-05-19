import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aiModelsApi } from '@/infrastructure/api/ai-models-api'
import { useToastStore } from '@/infrastructure/stores/toast-store'
import type { AiModelCreate, AiModelUpdate } from '@/core/api/types'

export function useAiModels() {
  return useQuery({
    queryKey: ['ai-models'],
    queryFn: () => aiModelsApi.list(),
  })
}

export function useAdminAiModels() {
  return useQuery({
    queryKey: ['admin', 'ai-models'],
    queryFn: () => aiModelsApi.listAll(),
  })
}

export function useCreateAiModel() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (req: AiModelCreate) => aiModelsApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-models'] })
      queryClient.invalidateQueries({ queryKey: ['ai-models'] })
      addToast('success', '模型已创建')
    },
  })
}

export function useUpdateAiModel() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: ({ id, ...req }: AiModelUpdate & { id: number }) =>
      aiModelsApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-models'] })
      queryClient.invalidateQueries({ queryKey: ['ai-models'] })
      addToast('success', '模型已更新')
    },
  })
}

export function useToggleAiModel() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      aiModelsApi.toggle(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-models'] })
      queryClient.invalidateQueries({ queryKey: ['ai-models'] })
      addToast('success', '模型状态已切换')
    },
  })
}

export function useDeleteAiModel() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (id: number) => aiModelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-models'] })
      queryClient.invalidateQueries({ queryKey: ['ai-models'] })
      addToast('success', '模型已删除')
    },
  })
}
