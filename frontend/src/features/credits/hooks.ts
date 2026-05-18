import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { creditsApi } from '@/infrastructure/api/credits-api'
import { useToastStore } from '@/infrastructure/stores/toast-store'
import type { RechargeRequest } from '@/core/api/types'

export function useBalance() {
  return useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: () => creditsApi.getBalance(),
    refetchInterval: 30_000,
  })
}

export function useRecharge() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (req: RechargeRequest) => creditsApi.recharge(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] })
      queryClient.invalidateQueries({ queryKey: ['credits', 'transactions'] })
      addToast('success', '充值成功')
    },
  })
}

export function useTransactions(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['credits', 'transactions', params],
    queryFn: () => creditsApi.listTransactions(params),
  })
}
