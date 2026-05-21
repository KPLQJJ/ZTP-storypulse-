import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Settings } from 'lucide-react'

interface AgentPanelProps {
  chatContent?: React.ReactNode
  configContent?: React.ReactNode
  defaultTab?: string
  className?: string
}

export function AgentPanel({
  chatContent,
  configContent,
  defaultTab = 'chat',
  className,
}: AgentPanelProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs defaultValue={defaultTab} className="flex flex-col h-full">
        <TabsList className="shrink-0 mx-2 mt-2 grid grid-cols-2 h-9">
          <TabsTrigger value="chat" className="text-xs gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            对话
          </TabsTrigger>
          <TabsTrigger value="config" className="text-xs gap-1">
            <Settings className="h-3.5 w-3.5" />
            配置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full p-3">{chatContent}</ScrollArea>
        </TabsContent>
        <TabsContent value="config" className="flex-1 m-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full p-3">{configContent}</ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
