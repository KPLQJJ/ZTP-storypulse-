import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PenLine, Upload } from 'lucide-react'
import { ScratchCreationDialog } from './ScratchCreationDialog'
import { ImportCreationDialog } from './ImportCreationDialog'

interface CreationCardsProps {
  className?: string
}

export function CreationCards({ className }: CreationCardsProps) {
  const [scratchOpen, setScratchOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  return (
    <>
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl', className)}>
        <button
          type="button"
          onClick={() => setScratchOpen(true)}
          className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50/80 via-white to-brand-50/30 p-8 text-left hover:border-brand-400 hover:shadow-lg hover:shadow-brand-100/50 transition-all duration-300"
        >
          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 group-hover:bg-brand-200 transition-colors">
              <PenLine className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">从零开始创作</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              输入作品名称和标签，AI 将帮你规划大纲、构建角色和世界观
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-100/40 to-transparent rounded-bl-full" />
        </button>

        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 p-8 text-left hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300"
        >
          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 group-hover:bg-amber-200 transition-colors">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">导入半成品续作</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              上传 .txt / .md 文件，AI 自动识别章节、提取角色和世界观
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/40 to-transparent rounded-bl-full" />
        </button>
      </div>

      <ScratchCreationDialog open={scratchOpen} onOpenChange={setScratchOpen} />
      <ImportCreationDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  )
}
