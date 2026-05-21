import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useNovel, useChapter, useUpdateChapter } from '@/features/novels/hooks'
import { useBreadcrumbTitle } from '@/ui/layout/BreadcrumbContext'
import { useOutlines, useCharacters, useWorldbuilding } from '@/features/workspace/hooks'
import { ThreePanelLayout } from '@/ui/components/ThreePanelLayout'
import { LeftSidebar } from '@/ui/components/LeftSidebar'
import { ChapterEditor } from '@/ui/components/ChapterEditor'
import { AgentPanel } from '@/ui/components/AgentPanel'
import { OutlineTree } from '@/features/workspace/components/OutlineTree'
import { ChapterList } from '@/features/workspace/components/ChapterList'
import { CharacterList } from '@/features/workspace/components/CharacterList'
import { WorldbuildingList } from '@/features/workspace/components/WorldbuildingList'
import { AgentChat } from '@/features/workspace/components/AgentChat'
import { AgentConfigDisplay } from '@/features/workspace/components/AgentConfigDisplay'
import { Skeleton } from '@/components/ui/skeleton'

export default function WritePage() {
  const { id } = useParams<{ id: string }>()
  const novelId = Number(id)

  const { data: novel, isLoading: novelLoading } = useNovel(novelId)
  useBreadcrumbTitle(novel?.title)
  const { data: outlines } = useOutlines(novelId)
  const { data: characters } = useCharacters(novelId)
  const { data: worldbuilding } = useWorldbuilding(novelId)

  // Chapter management
  const chapters = novel?.chapters ?? []
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null)
  const [localTitle, setLocalTitle] = useState('')
  const [localContent, setLocalContent] = useState('')

  const { data: chapterDetail } = useChapter(novelId, activeChapterId!)
  const updateChapter = useUpdateChapter(novelId)

  // Auto-select first chapter
  useEffect(() => {
    if (!activeChapterId && chapters.length > 0) {
      setActiveChapterId(chapters[0].id)
    }
  }, [chapters, activeChapterId])

  // Sync chapter data when loaded
  useEffect(() => {
    if (chapterDetail) {
      setLocalTitle(chapterDetail.title)
      setLocalContent(chapterDetail.content)
    }
  }, [chapterDetail])

  // Navigate chapters
  const currentIndex = chapters.findIndex((c) => c.id === activeChapterId)
  const totalChapters = chapters.length

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) setActiveChapterId(chapters[currentIndex - 1].id)
  }, [currentIndex, chapters])

  const goToNext = useCallback(() => {
    if (currentIndex < chapters.length - 1) setActiveChapterId(chapters[currentIndex + 1].id)
  }, [currentIndex, chapters])

  // Auto-save with 2s debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleContentChange = useCallback(
    (content: string) => {
      setLocalContent(content)
      if (!activeChapterId) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        updateChapter.mutate({ chapterId: activeChapterId, req: { content } })
      }, 2000)
    },
    [activeChapterId, updateChapter],
  )

  const handleTitleChange = useCallback(
    (title: string) => {
      setLocalTitle(title)
      if (!activeChapterId) return
      updateChapter.mutate({ chapterId: activeChapterId, req: { title } })
    },
    [activeChapterId, updateChapter],
  )

  if (novelLoading) {
    return (
      <div className="-m-4 md:-m-6 h-[calc(100vh-3.5rem)]">
        <ThreePanelLayout
          left={<Skeleton className="h-full rounded-none" />}
          center={<Skeleton className="h-full rounded-none" />}
          right={<Skeleton className="h-full rounded-none" />}
        />
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        作品不存在
      </div>
    )
  }

  const activeChapter = chapters.find((c) => c.id === activeChapterId)

  return (
    <div className="-m-4 md:-m-6">
      <ThreePanelLayout
        left={
          <LeftSidebar
            outlineContent={
              <OutlineTree
                outlines={outlines ?? []}
              />
            }
            chaptersContent={
              <ChapterList
                chapters={chapters}
                activeChapterId={activeChapterId}
                onSelectChapter={setActiveChapterId}
              />
            }
            charactersContent={
              <CharacterList
                characters={characters ?? []}
              />
            }
            worldbuildingContent={
              <WorldbuildingList
                entries={worldbuilding ?? []}
              />
            }
          />
        }
        center={
          activeChapter ? (
            <ChapterEditor
              key={activeChapterId}
              title={localTitle}
              content={localContent}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              wordCount={localContent.length}
              chapterIndex={activeChapter.chapter_index}
              totalChapters={totalChapters}
              onPrev={currentIndex > 0 ? goToPrev : undefined}
              onNext={currentIndex < totalChapters - 1 ? goToNext : undefined}
              placeholder="在这里开始创作..."
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium mb-1">尚未导入章节</p>
                <p className="text-sm">请先导入作品文件，或在大纲中创建章节</p>
              </div>
            </div>
          )
        }
        right={
          <AgentPanel
            chatContent={<AgentChat novelId={novelId} />}
            configContent={<AgentConfigDisplay novelId={novelId} />}
          />
        }
      />
    </div>
  )
}
