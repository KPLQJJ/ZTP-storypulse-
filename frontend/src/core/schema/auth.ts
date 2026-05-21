import { z } from 'zod'

export const registerSchema = z.object({
  username: z
    .string()
    .min(2, '用户名至少 2 个字符')
    .max(50, '用户名最多 50 个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(8, '密码至少 8 位')
    .regex(/[A-Z]/, '密码须包含至少一个大写字母')
    .regex(/[0-9]/, '密码须包含至少一个数字'),
})

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
})

export type RegisterForm = z.infer<typeof registerSchema>
export type LoginForm = z.infer<typeof loginSchema>
