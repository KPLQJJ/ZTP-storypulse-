import { Link } from 'react-router-dom'
import { useAuthStore } from '@/infrastructure/stores/auth-store'
import { useBalance } from '@/features/credits/hooks'
import { formatCredits, formatDate } from '@/core/domain/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { BookOpen, History, Coins, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const { data: balance } = useBalance()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">个人中心</h1>
        <p className="text-sm text-muted-foreground mt-1">管理你的账户信息</p>
      </div>

      {/* User info card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-brand-600 text-white text-xl">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{user.username}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <p className="text-xs text-muted-foreground mt-1">
                注册时间：{formatDate(user.created_at)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Credit balance */}
      <Card>
        <CardHeader>
          <CardDescription>积分余额</CardDescription>
          <div className="flex items-center gap-2 mt-1">
            <Coins className="h-6 w-6 text-amber-500" />
            <span className="text-3xl font-bold tracking-tight">
              {balance ? formatCredits(balance.balance) : '--'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Link to="/credits/recharge">
            <Button variant="brand">充值积分</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">快捷入口</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/novels" className="block">
            <Button variant="outline" className="w-full justify-start gap-3">
              <BookOpen className="h-4 w-4" />
              我的作品
            </Button>
          </Link>
          <Link to="/reviews" className="block">
            <Button variant="outline" className="w-full justify-start gap-3">
              <History className="h-4 w-4" />
              审稿历史
            </Button>
          </Link>
          <Link to="/credits" className="block">
            <Button variant="outline" className="w-full justify-start gap-3">
              <Coins className="h-4 w-4" />
              积分中心
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full gap-2 text-destructive hover:text-destructive"
        onClick={logout}
      >
        <LogOut className="h-4 w-4" />
        退出登录
      </Button>
    </div>
  )
}
