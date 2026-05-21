import { cn } from '@/lib/utils'

interface ThreePanelLayoutProps {
  left: React.ReactNode
  center: React.ReactNode
  right: React.ReactNode
  leftWidth?: number
  rightWidth?: number
  className?: string
}

export function ThreePanelLayout({
  left,
  center,
  right,
  leftWidth = 280,
  rightWidth = 360,
  className,
}: ThreePanelLayoutProps) {
  return (
    <div className={cn('flex h-[calc(100vh-3.5rem)]', className)}>
      {/* Left Panel */}
      <aside
        className="shrink-0 border-r border-border bg-white/60 overflow-y-auto"
        style={{ width: leftWidth }}
      >
        {left}
      </aside>

      {/* Center Panel */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {center}
      </main>

      {/* Right Panel */}
      <aside
        className="shrink-0 border-l border-border bg-white/60 overflow-y-auto"
        style={{ width: rightWidth }}
      >
        {right}
      </aside>
    </div>
  )
}
