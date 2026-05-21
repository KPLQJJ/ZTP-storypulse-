import { useState } from 'react'
import { useAgentSessions, useAgentSession, useCreateAgentSession, useSendAgentMessage } from '@/features/workspace/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Send, MessageSquare, Bot } from 'lucide-react'

const AGENT_ROLES = [
  { value: 'outline_writer', label: '大纲规划师' },
  { value: 'chapter_writer', label: '章节作家' },
  { value: 'world_builder', label: '世界观架构师' },
  { value: 'character_designer', label: '角色设计师' },
  { value: 'polisher', label: '文字润色师' },
  { value: 'reviewer', label: '七维审稿人' },
]

interface AgentChatProps {
  novelId: number
}

export function AgentChat({ novelId }: AgentChatProps) {
  const { data: sessions } = useAgentSessions(novelId)
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('chapter_writer')

  const { data: sessionDetail } = useAgentSession(activeSessionId!)
  const createSession = useCreateAgentSession()
  const sendMessage = useSendAgentMessage()

  const selectedAgent = AGENT_ROLES.find((r) => r.value === selectedRole)

  function handleCreateSession() {
    createSession.mutate(
      {
        novel_id: novelId,
        title: `${selectedAgent?.label ?? selectedRole} — ${new Date().toLocaleTimeString()}`,
        context_type: selectedRole,
      },
      { onSuccess: (data) => setActiveSessionId(data.id) },
    )
  }

  function handleSend() {
    if (!message.trim() || !activeSessionId) return
    sendMessage.mutate(
      {
        session_id: activeSessionId,
        role: 'user',
        content: message.trim(),
        agent_name: selectedAgent?.label ?? selectedRole,
      },
      { onSuccess: () => setMessage('') },
    )
  }

  if (!activeSessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-4">
        <Bot className="h-10 w-10 text-muted-foreground/30" />
        <div>
          <p className="text-sm font-medium mb-1">多 Agent 协作创作</p>
          <p className="text-xs text-muted-foreground">选择 Agent 角色，开始对话</p>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGENT_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="brand"
            size="sm"
            className="w-full"
            onClick={handleCreateSession}
            disabled={createSession.isPending}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {createSession.isPending ? '创建中...' : '新建对话'}
          </Button>
        </div>

        {sessions && sessions.length > 0 && (
          <div className="w-full max-w-xs mt-2">
            <p className="text-xs text-muted-foreground mb-2">历史对话</p>
            <div className="space-y-0.5">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSessionId(s.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  {s.title || `对话 #${s.id}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const messages = sessionDetail?.messages ?? []

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-1 py-2 border-b border-border/40 shrink-0">
        <button
          type="button"
          onClick={() => setActiveSessionId(null)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← 返回
        </button>
        <span className="text-xs text-muted-foreground truncate flex-1">
          {sessionDetail?.title || `对话 #${activeSessionId}`}
        </span>
      </div>

      <ScrollArea className="flex-1 p-2">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            发送消息开始与 AI 对话
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-100 text-brand-900'
                      : msg.role === 'system'
                      ? 'bg-gray-100 text-gray-600 text-xs italic'
                      : 'bg-gray-100 text-foreground'
                  }`}
                >
                  {msg.agent_name && (
                    <p className="text-xs font-medium text-brand-600 mb-0.5">{msg.agent_name}</p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {sendMessage.isPending && (
          <p className="text-xs text-muted-foreground text-center py-2 animate-pulse">
            AI 正在思考...
          </p>
        )}
      </ScrollArea>

      <div className="flex items-center gap-2 p-2 border-t border-border/40 shrink-0">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入消息..."
          className="h-8 text-sm"
        />
        <Button
          variant="brand"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleSend}
          disabled={!message.trim() || sendMessage.isPending}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
