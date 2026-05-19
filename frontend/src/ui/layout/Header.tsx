import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Coins, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/infrastructure/stores/ui-store'
import { useAuthStore } from '@/infrastructure/stores/auth-store'
import { useBalance } from '@/features/credits/hooks'
import { useLogout } from '@/features/auth/hooks'
import { formatCredits } from '@/core/domain/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const pageTitles: Record<string, string> = {
  '/': '仪表盘',
  '/novels': '作品列表',
  '/novels/new': '新建作品',
  '/reviews': '审稿历史',
  '/reviews/new': '发起审稿',
  '/credits': '积分中心',
  '/credits/recharge': '充值中心',
  '/credits/transactions': '交易流水',
  '/profile': '个人中心',
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname]
  // Dynamic routes
  if (pathname.startsWith('/novels/') && pathname !== '/novels/new') return '作品详情'
  if (pathname.startsWith('/reviews/') && pathname !== '/reviews/new') return '审稿报告'
  return 'StoryPulse'
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { sidebarCollapsed } = useUiStore()
  const { user } = useAuthStore()
  const handleLogout = useLogout()
  const { data: balance } = useBalance()
  const location = useLocation()

  const title = getPageTitle(location.pathname)

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-14 items-center justify-between border-b bg-white/80 backdrop-blur-sm px-6 transition-all duration-200 left-0',
        sidebarCollapsed ? 'md:left-16' : 'md:left-60',
      )}
    >
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden -ml-2"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span>首页</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{title}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Credit badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">
          <Coins className="h-3.5 w-3.5" />
          <span>
            积分: {balance ? formatCredits(balance.balance) : '--'}
          </span>
        </div>

        {/* User dropdown */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all">
                <AvatarFallback className="bg-brand-600 text-white text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">个人中心</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  )
}
