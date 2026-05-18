import { z } from 'zod'

export const rechargeSchema = z.object({
  amount: z
    .number()
    .min(0.01, '充值金额不能少于 0.01')
    .max(10000, '单笔充值不能超过 10000'),
})

export type RechargeForm = z.infer<typeof rechargeSchema>
