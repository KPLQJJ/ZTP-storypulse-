import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ListTree,
  BookOpen,
  Users,
  Globe,
} from 'lucide-react'

interface LeftSidebarProps {
  novelId?: number
  outlineContent?: React.ReactNode
  chaptersContent?: React.ReactNode
  charactersContent?: React.ReactNode
  worldbuildingContent?: React.ReactNode
  defaultTab?: string
  className?: string
}

export function LeftSidebar({
  outlineContent,
  chaptersContent,
  charactersContent,
  worldbuildingContent,
  defaultTab = 'outline',
  className,
}: LeftSidebarProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs defaultValue={defaultTab} className="flex flex-col h-full">
        <TabsList className="shrink-0 mx-2 mt-2 grid grid-cols-4 h-9">
          <TabsTrigger value="outline" className="text-xs gap-1 px-1">
            <ListTree className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">大纲</span>
          </TabsTrigger>
          <TabsTrigger value="chapters" className="text-xs gap-1 px-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">章节</span>
          </TabsTrigger>
          <TabsTrigger value="characters" className="text-xs gap-1 px-1">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">角色</span>
          </TabsTrigger>
          <TabsTrigger value="worldbuilding" className="text-xs gap-1 px-1">
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">世界观</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outline" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full px-3 py-2">{outlineContent}</ScrollArea>
        </TabsContent>
        <TabsContent value="chapters" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full px-3 py-2">{chaptersContent}</ScrollArea>
        </TabsContent>
        <TabsContent value="characters" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full px-3 py-2">{charactersContent}</ScrollArea>
        </TabsContent>
        <TabsContent value="worldbuilding" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full px-3 py-2">{worldbuildingContent}</ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
