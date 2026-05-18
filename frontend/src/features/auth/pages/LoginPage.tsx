import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { loginSchema, type LoginForm } from '@/core/schema/auth'
import { useLogin } from '@/features/auth/hooks'
import { useAuthStore } from '@/infrastructure/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default function LoginPage() {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/novels'
  const login = useLogin(from)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Already logged in
  if (token) {
    return <Navigate to={from} replace />
  }

  function onSubmit(data: LoginForm) {
    login.mutate(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">登录 StoryPulse</CardTitle>
          <CardDescription>AI 驱动的网文创作审稿平台</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            {login.error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {login.error instanceof Error ? login.error.message : '登录失败'}
              </p>
            )}

            <Button
              type="submit"
              disabled={login.isPending}
              variant="brand" className="w-full"
            >
              {login.isPending ? '登录中...' : '登录'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              还没有账号？{' '}
              <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
                立即注册
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
