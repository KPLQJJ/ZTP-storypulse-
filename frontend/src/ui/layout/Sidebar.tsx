import { NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  PenLine,
  Sparkles,
  History,
  Coins,
  Wallet,
  Receipt,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Cpu,
} from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/infrastructure/stores/ui-store'
import { useAuthStore } from '@/infrastructure/stores/auth-store'
import { useLogout } from '@/features/auth/hooks'

interface MenuItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user } = useAuthStore()
  const handleLogout = useLogout()
  const location = useLocation()

  const menuSections = useMemo<MenuSection[]>(() => {
    const sections: MenuSection[] = [
      {
        title: '创作管理',
        items: [
          { label: '作品列表', path: '/novels', icon: BookOpen },
          { label: '新建作品', path: '/novels/new', icon: PenLine },
        ],
      },
      {
        title: 'AI 审稿',
        items: [
          { label: '发起审稿', path: '/reviews/new', icon: Sparkles },
          { label: '审稿历史', path: '/reviews', icon: History },
        ],
      },
      {
        title: '积分中心',
        items: [
          { label: '积分余额', path: '/credits', icon: Coins },
          { label: '充值中心', path: '/credits/recharge', icon: Wallet },
          { label: '交易流水', path: '/credits/transactions', icon: Receipt },
        ],
      },
      {
        title: '账户',
        items: [
          { label: '个人中心', path: '/profile', icon: User },
        ],
      },
    ]

    if (user?.role === 'admin') {
      sections.push({
        title: '后台管理',
        items: [
          { label: '模型管理', path: '/admin/ai-models', icon: Cpu },
        ],
      })
    }

    return sections
  }, [user?.role])

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar-bg text-sidebar-fg transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-white/8">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold tracking-wide text-white">
            StoryPulse
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-fg hover:text-white hover:bg-sidebar-hover ml-auto"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Menu sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
        {menuSections.map((section) => (
          <div key={section.title}>
            {!sidebarCollapsed && (
              <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-sidebar-fg/50">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/novels' && /^\/novels\/\d+$/.test(location.pathname)) ||
                  (item.path === '/reviews' && /^\/reviews\/\d+$/.test(location.pathname)) ||
                  (item.path === '/credits' && location.pathname === '/credits') ||
                  (item.path === '/credits/recharge' && location.pathname === '/credits/recharge') ||
                  (item.path === '/credits/transactions' && location.pathname === '/credits/transactions') ||
                  (item.path === '/admin/ai-models' && location.pathname.startsWith('/admin/ai-models'))

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-active/20 text-sidebar-active'
                          : 'text-sidebar-fg hover:bg-sidebar-hover hover:text-white',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Separator className="bg-white/8" />

      {/* User area */}
      <div className="p-3">
        {user ? (
          <div className={cn(
            'flex items-center gap-3 rounded-lg px-2 py-2',
            sidebarCollapsed && 'justify-center',
          )}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-medium text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user.username}
                </p>
                <p className="truncate text-xs text-sidebar-fg/60">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        ) : null}
        {!sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-fg/60 hover:bg-sidebar-hover hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        )}
      </div>
    </aside>
  )
}
