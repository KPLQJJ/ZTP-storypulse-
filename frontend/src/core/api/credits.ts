import type { RechargeRequest, BalanceResponse, TransactionOut } from './types'

export interface ICreditApi {
  getBalance(): Promise<BalanceResponse>
  recharge(req: RechargeRequest): Promise<TransactionOut>
  listTransactions(params?: { limit?: number; offset?: number }): Promise<TransactionOut[]>
  getTransaction(txnId: number): Promise<TransactionOut>
}
