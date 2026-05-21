import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ChapterEditorProps {
  title?: string
  content?: string
  onTitleChange?: (title: string) => void
  onContentChange?: (content: string) => void
  wordCount?: number
  chapterIndex?: number
  totalChapters?: number
  onPrev?: () => void
  onNext?: () => void
  readOnly?: boolean
  placeholder?: string
  className?: string
}

export function ChapterEditor({
  title: initialTitle = '',
  content: initialContent = '',
  onTitleChange,
  onContentChange,
  wordCount,
  chapterIndex,
  totalChapters,
  onPrev,
  onNext,
  readOnly = false,
  placeholder = '开始创作...',
  className,
}: ChapterEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setTitle(initialTitle)
    setContent(initialContent)
  }, [initialTitle, initialContent])

  const handleContentChange = useCallback(
    (value: string) => {
      setContent(value)
      onContentChange?.(value)

      // Auto-save: debounce 2s
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = setTimeout(() => {
        // Auto-save callback handled by parent via onContentChange
      }, 2000)
    },
    [onContentChange],
  )

  const displayWordCount = wordCount ?? content.length

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Chapter navigation bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-white/80 shrink-0">
        <div className="flex items-center gap-2">
          {onPrev && (
            <button
              onClick={onPrev}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← 上一章
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {chapterIndex != null && (
            <span>
              第 {chapterIndex} 章{totalChapters ? ` / ${totalChapters}` : ''}
            </span>
          )}
          <span>{displayWordCount.toLocaleString()} 字</span>
        </div>
        <div className="flex items-center gap-2">
          {onNext && (
            <button
              onClick={onNext}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              下一章 →
            </button>
          )}
        </div>
      </div>

      {/* Title input */}
      <div className="px-6 pt-6 shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            onTitleChange?.(e.target.value)
          }}
          readOnly={readOnly}
          placeholder="章节标题"
          className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Content textarea */}
      <div className="flex-1 px-6 py-4">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className="w-full h-full resize-none bg-transparent border-none outline-none text-base leading-relaxed placeholder:text-muted-foreground/30 font-serif"
        />
      </div>
    </div>
  )
}
