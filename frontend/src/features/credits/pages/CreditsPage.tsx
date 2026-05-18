import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { rechargeSchema, type RechargeForm } from '@/core/schema/credits'
import { useBalance, useRecharge, useTransactions } from '@/features/credits/hooks'
import { formatCredits, formatDate } from '@/core/domain/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, Wallet, Receipt, TrendingUp, TrendingDown } from 'lucide-react'

type Tab = 'balance' | 'recharge' | 'transactions'

export default function CreditsPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const tab: Tab = location.pathname.includes('recharge')
    ? 'recharge'
    : location.pathname.includes('transactions')
    ? 'transactions'
    : 'balance'

  function switchTab(v: string) {
    const routes: Record<Tab, string> = {
      balance: '/credits',
      recharge: '/credits/recharge',
      transactions: '/credits/transactions',
    }
    navigate(routes[v as Tab])
  }

  const { data: balance } = useBalance()
  const recharge = useRecharge()
  const { data: transactions } = useTransactions({ limit: 30 })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RechargeForm>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: { amount: 10 },
  })

  function onRecharge(data: RechargeForm) {
    recharge.mutate(
      { amount: data.amount },
      { onSuccess: () => reset({ amount: 10 }) },
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">积分中心</h1>
        <p className="text-sm text-muted-foreground mt-1">管理你的积分和交易记录</p>
      </div>

      <Tabs value={tab} onValueChange={switchTab}>
        <TabsList className="w-full mb-6">
          <TabsTrigger value="balance" className="flex-1 gap-1.5">
            <Coins className="h-4 w-4" />
            积分余额
          </TabsTrigger>
          <TabsTrigger value="recharge" className="flex-1 gap-1.5">
            <Wallet className="h-4 w-4" />
            充值中心
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 gap-1.5">
            <Receipt className="h-4 w-4" />
            交易流水
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balance">
          <Card>
            <CardHeader className="text-center">
              <CardDescription>当前积分余额</CardDescription>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Coins className="h-8 w-8 text-amber-500" />
                <span className="text-5xl font-bold tracking-tight">
                  {balance ? formatCredits(balance.balance) : '--'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => switchTab('recharge')}
                variant="brand"
              >
                立即充值
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recharge">
          <Card>
            <CardHeader>
              <CardTitle>充值积分</CardTitle>
              <CardDescription>充值金额范围：0.01 ~ 10,000</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onRecharge)} className="space-y-4">
                <div>
                  <Label htmlFor="amount">充值金额</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...register('amount', { valueAsNumber: true })}
                      className="max-w-[200px]"
                    />
                    <span className="text-sm text-muted-foreground">积分</span>
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[10, 50, 100, 500, 1000].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => reset({ amount: n })}
                      className="rounded-full border px-3 py-1 text-xs hover:bg-brand-50 hover:border-brand-300 transition-colors"
                    >
                      {n} 积分
                    </button>
                  ))}
                </div>

                {recharge.error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    {recharge.error instanceof Error
                      ? recharge.error.message
                      : '充值失败'}
                  </p>
                )}

                {recharge.isSuccess && (
                  <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                    充值成功！
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={recharge.isPending}
                  variant="brand" className="w-full"
                >
                  {recharge.isPending ? '处理中...' : '确认充值'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>交易流水</CardTitle>
              <CardDescription>最近 30 笔交易记录</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!transactions?.length ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  暂无交易记录
                </p>
              ) : (
                <div className="divide-y">
                  {transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between px-6 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            txn.amount > 0
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {txn.amount > 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {txn.description || (txn.amount > 0 ? '充值' : '消费')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(txn.created_at)}
                            {txn.type && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {txn.type === 'recharge'
                                  ? '充值'
                                  : txn.type === 'spend'
                                  ? '消费'
                                  : txn.type === 'bonus'
                                  ? '赠送'
                                  : txn.type}
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            txn.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {txn.amount > 0 ? '+' : ''}
                          {formatCredits(txn.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          余额: {formatCredits(txn.balance_after)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
