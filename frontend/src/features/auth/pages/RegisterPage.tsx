import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { registerSchema, type RegisterForm } from '@/core/schema/auth'
import { useRegister } from '@/features/auth/hooks'
import { useAuthStore } from '@/infrastructure/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PenLine } from 'lucide-react'

export default function RegisterPage() {
  const token = useAuthStore((s) => s.token)
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  if (token) {
    return <Navigate to="/novels" replace />
  }

  function onSubmit(data: RegisterForm) {
    registerMutation.mutate(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <PenLine className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">注册 StoryPulse</CardTitle>
          <CardDescription>开启你的 AI 创作之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                placeholder="2-50 个字符"
                {...register('username')}
                className="mt-1.5"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className="mt-1.5"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少 6 位"
                {...register('password')}
                className="mt-1.5"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {registerMutation.error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {registerMutation.error instanceof Error
                  ? registerMutation.error.message
                  : '注册失败'}
              </p>
            )}

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              variant="brand" className="w-full"
            >
              {registerMutation.isPending ? '注册中...' : '注册'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              已有账号？{' '}
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                去登录
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
