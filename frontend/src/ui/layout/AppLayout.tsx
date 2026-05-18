import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUiStore } from '@/infrastructure/stores/ui-store'
import { useAuthStore } from '@/infrastructure/stores/auth-store'
import { menuSections } from './Sidebar'
import type { MenuItem, MenuSection } from './Sidebar'
import { LogOut } from 'lucide-react'

function MobileNavContent({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="border-b pb-4">
        <SheetTitle className="text-lg font-bold">StoryPulse</SheetTitle>
      </SheetHeader>

      <nav className="flex-1 overflow-y-auto py-4 space-y-3">
        {menuSections.map((section: MenuSection) => (
          <div key={section.title}>
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item: MenuItem) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/novels' && /^\/novels\/\d+$/.test(location.pathname)) ||
                  (item.path === '/reviews' && /^\/reviews\/\d+$/.test(location.pathname)) ||
                  (item.path === '/credits' && location.pathname === '/credits') ||
                  (item.path === '/credits/recharge' && location.pathname === '/credits/recharge') ||
                  (item.path === '/credits/transactions' && location.pathname === '/credits/transactions')

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
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
            onClick={() => { logout(); onClose() }}
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
          <Outlet />
        </div>
      </main>
    </div>
  )
}
