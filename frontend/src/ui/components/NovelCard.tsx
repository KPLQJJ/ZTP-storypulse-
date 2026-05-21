import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Image, Download, Trash2 } from 'lucide-react'
import { TAGS_BY_KEY } from '@/core/domain/tags'
import type { NovelOut } from '@/core/api/types'

interface NovelCardProps {
  novel: NovelOut
  href?: string
  onDelete?: (id: number) => void
  className?: string
}

export function NovelCard({ novel, href, onDelete, className }: NovelCardProps) {
  const navigate = useNavigate()

  const tags: string[] = (() => {
    try {
      return JSON.parse(novel.tags || '[]')
    } catch {
      return []
    }
  })()

  const hasCover = !!novel.cover_url
  const firstChar = novel.title.charAt(0)
  const updatedDate = novel.updated_at
    ? new Date(novel.updated_at).toISOString().slice(0, 10)
    : ''

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const { novelsApi } = await import('@/infrastructure/api/novels-api')
    const data = await novelsApi.exportNovel(novel.id)
    const blob = new Blob([data.text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`确定要删除《${novel.title}》吗？此操作不可撤销。`)) {
      onDelete?.(novel.id)
    }
  }

  const detailHref = href ?? `/workspace/novel/${novel.id}`

  return (
    <div
      className={cn(
        'group w-full text-left rounded-xl overflow-hidden',
        'bg-white border border-border/60',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]',
        'hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),0_2px_6px_rgba(196,107,60,0.08)]',
        'hover:scale-[1.02] transition-all duration-200',
        className,
      )}
    >
      {/* Cover area — 16:9 — clickable */}
      <button
        type="button"
        onClick={() => navigate(detailHref)}
        className="relative w-full block"
        style={{ aspectRatio: '16/9' }}
      >
        {hasCover ? (
          <img
            src={novel.cover_url!}
            alt={novel.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-50 via-brand-100 to-brand-200 flex items-center justify-center">
            <span
              className="text-[4rem] font-bold text-brand-300/30 select-none"
              style={{ textShadow: '0 2px 12px rgb(196 107 60 / 0.15)' }}
            >
              {firstChar}
            </span>
          </div>
        )}

        {/* Overlay at bottom of cover */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
          <h3 className="text-white font-bold text-base leading-tight truncate">
            {novel.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs text-white/80 bg-white/15 rounded-full px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
            <span className="text-xs text-white/60">
              {novel.word_count.toLocaleString()} 字
            </span>
            {updatedDate && (
              <span className="text-xs text-white/50 ml-auto">{updatedDate}</span>
            )}
          </div>
        </div>
      </button>

      {/* Action bar — outside cover */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-border/40 bg-white/80">
        <div className="flex items-center gap-1 min-w-0">
          {tags.slice(0, 2).map((key) => {
            const tag = TAGS_BY_KEY[key]
            return (
              <span
                key={key}
                className="text-xs text-muted-foreground bg-gray-100 rounded-full px-2 py-0.5 truncate"
              >
                {tag?.label ?? key}
              </span>
            )
          })}
          {tags.length === 0 && (
            <span className="text-xs text-muted-foreground">未分类</span>
          )}
        </div>
        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); /* TODO: cover upload */ }}
            className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-foreground transition-colors"
            title="封面管理"
          >
            <Image className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-foreground transition-colors"
            title="下载"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
            title="删除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>
    </div>
  )
}
