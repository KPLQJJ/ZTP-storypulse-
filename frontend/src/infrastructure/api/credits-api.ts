import type { ICreditApi } from '@/core/api/credits'
import type { RechargeRequest, BalanceResponse, TransactionOut } from '@/core/api/types'
import { http } from '@/infrastructure/http-client'

export const creditsApi: ICreditApi = {
  async getBalance(): Promise<BalanceResponse> {
    return http.get<BalanceResponse>('/credits/balance')
  },

  async recharge(req: RechargeRequest): Promise<TransactionOut> {
    return http.post<TransactionOut>('/credits/recharge', req)
  },

  async listTransactions(params = {}): Promise<TransactionOut[]> {
    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.set('limit', String(params.limit))
    if (params.offset) searchParams.set('offset', String(params.offset))
    const qs = searchParams.toString()
    return http.get<TransactionOut[]>(`/credits/transactions${qs ? `?${qs}` : ''}`)
  },

  async getTransaction(txnId: number): Promise<TransactionOut> {
    return http.get<TransactionOut>(`/credits/transactions/${txnId}`)
  },
}
