import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BreadcrumbProvider } from './BreadcrumbContext'
import { useUiStore } from '@/infrastructure/stores/ui-store'
import { useAuthStore } from '@/infrastructure/stores/auth-store'
import { useLogout } from '@/features/auth/hooks'
import {
  PenLine,
  Paintbrush,
  Sparkles,
  Coins,
  Receipt,
  User,
  LogOut,
  Cpu,
  Settings,
  LayoutDashboard,
} from 'lucide-react'

interface MenuItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

function isMobileActive(path: string, location: ReturnType<typeof useLocation>): boolean {
  const p = location.pathname
  if (path === '/workspace') return p === '/workspace' || p.startsWith('/workspace/')
  if (path === '/write') return p.startsWith('/write')
  if (path === '/polish') return p.startsWith('/polish')
  if (path === '/review') return p.startsWith('/review')
  if (path === '/credits') return p === '/credits' || p === '/credits/transactions'
  if (path === '/credits/transactions') return p === '/credits/transactions'
  if (path === '/profile') return p === '/profile'
  if (path === '/admin/ai-models') return p.startsWith('/admin/ai-models')
  if (path === '/admin/api-providers') return p === '/admin/api-providers'
  return p === path
}

const mobileMainSections: MenuSection[] = [
  {
    title: '',
    items: [
      { label: '工作台', path: '/workspace', icon: LayoutDashboard },
    ],
  },
  {
    title: '功能模块',
    items: [
      { label: '创作', path: '/write', icon: PenLine },
      { label: '润色', path: '/polish', icon: Paintbrush },
      { label: '审稿', path: '/review', icon: Sparkles },
    ],
  },
  {
    title: '积分中心',
    items: [
      { label: '积分余额', path: '/credits', icon: Coins },
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

const mobileAdminSection: MenuSection = {
  title: '后台管理',
  items: [
    { label: '模型管理', path: '/admin/ai-models', icon: Cpu },
    { label: 'API 账号', path: '/admin/api-providers', icon: Settings },
  ],
}

function MobileNavContent({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const handleLogout = useLogout()
  const location = useLocation()

  const sections = user?.role === 'admin'
    ? [...mobileMainSections, mobileAdminSection]
    : mobileMainSections

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="border-b pb-4">
        <SheetTitle className="text-lg font-bold">StoryPulse</SheetTitle>
      </SheetHeader>

      <nav className="flex-1 overflow-y-auto py-4 space-y-3">
        {sections.map((section: MenuSection) => (
          <div key={section.title}>
            {section.title && (
              <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item: MenuItem) => {
                const active = isMobileActive(item.path, location)
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors text-sm font-medium',
                        active
                          ? 'bg-brand-50 text-brand-700'
                          : 'hover:bg-gray-100 text-foreground',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Separator />
      {user && (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-medium text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.username}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => { handleLogout(); onClose() }}
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </Button>
        </div>
      )}
    </div>
  )
}

export function AppLayout() {
  const { sidebarCollapsed } = useUiStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-page">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <Header onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <MobileNavContent onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <main
        className={cn(
          'pt-14 transition-all duration-200',
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-60',
        )}
      >
        <div className="p-4 md:p-6">
          <BreadcrumbProvider>
            <Outlet />
          </BreadcrumbProvider>
        </div>
      </main>
    </div>
  )
}
