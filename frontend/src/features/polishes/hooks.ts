import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { polishesApi } from '@/infrastructure/api/polishes-api'
import { useToastStore } from '@/infrastructure/stores/toast-store'
import type { PolishRequest } from '@/core/api/types'

export function usePolishes(novelId: number) {
  return useQuery({
    queryKey: ['polishes', novelId],
    queryFn: () => polishesApi.list(novelId),
    enabled: !!novelId,
  })
}

export function usePolish(polishId: number) {
  return useQuery({
    queryKey: ['polish', polishId],
    queryFn: () => polishesApi.get(polishId),
    enabled: !!polishId,
  })
}

export function useCreatePolish() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: ({ novelId, req }: { novelId: number; req: PolishRequest }) =>
      polishesApi.create(novelId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polishes'] })
      queryClient.invalidateQueries({ queryKey: ['novels'] })
      addToast('success', 'AI 润色完成')
    },
  })
}
