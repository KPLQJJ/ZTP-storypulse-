import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { modelPreferencesApi } from '@/infrastructure/api/model-preferences-api'
import { useToastStore } from '@/infrastructure/stores/toast-store'
import type { ModelPreferenceCreate } from '@/core/api/types'

export function useModelPreferences(novelId?: number) {
  return useQuery({
    queryKey: ['model-preferences', novelId],
    queryFn: () => modelPreferencesApi.list(novelId),
  })
}

export function useResolvedModelPreference(applicationType: string, novelId?: number) {
  return useQuery({
    queryKey: ['model-preferences', 'resolve', applicationType, novelId],
    queryFn: () => modelPreferencesApi.resolve(applicationType, novelId),
    enabled: !!applicationType,
  })
}

export function useUpsertModelPreference() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (req: ModelPreferenceCreate) => modelPreferencesApi.upsert(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-preferences'] })
      addToast('success', '模型偏好已保存')
    },
  })
}

export function useDeleteModelPreference() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (id: number) => modelPreferencesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-preferences'] })
      addToast('success', '偏好已删除')
    },
  })
}
