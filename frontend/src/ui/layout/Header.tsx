import { Fragment } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Coins, Menu, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/infrastructure/stores/ui-store'
import { useAuthStore } from '@/infrastructure/stores/auth-store'
import { useBalance } from '@/features/credits/hooks'
import { useLogout } from '@/features/auth/hooks'
import { formatCredits } from '@/core/domain/utils'
import { resolveBreadcrumbs } from '@/core/domain/breadcrumbs'
import { useBreadcrumbContext } from './BreadcrumbContext'
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

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { sidebarCollapsed } = useUiStore()
  const { user } = useAuthStore()
  const handleLogout = useLogout()
  const { data: balance } = useBalance()
  const location = useLocation()
  const { dynamicTitle } = useBreadcrumbContext()

  const segments = resolveBreadcrumbs(location.pathname, dynamicTitle)

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-14 items-center justify-between border-b bg-white/80 backdrop-blur-sm px-6 transition-all duration-200 left-0',
        sidebarCollapsed ? 'md:left-16' : 'md:left-60',
      )}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden -ml-2 shrink-0"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link
          to="/workspace"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">StoryPulse首页</span>
        </Link>

        {segments.map((seg, i) => (
          <Fragment key={i}>
            <ChevronRight className="h-3 w-3 text-muted-foreground/60 shrink-0" />
            {seg.path ? (
              <Link
                to={seg.path}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-40"
              >
                {seg.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground truncate max-w-40">
                {seg.label}
              </span>
            )}
          </Fragment>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4 shrink-0">
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
