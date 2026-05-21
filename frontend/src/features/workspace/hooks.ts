import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { novelGroupsApi } from '@/infrastructure/api/novel-groups-api'
import { http } from '@/infrastructure/http-client'
import { ENDPOINTS } from '@/core/api/endpoints'
import { useToastStore } from '@/infrastructure/stores/toast-store'
import type { NovelGroupCreate, NovelGroupUpdate, OutlineOut, CharacterOut, WorldbuildingOut, AgentConfigOut, AgentConfigUpsert, AgentSessionOut, AgentSessionDetail, AgentSessionCreate, AgentMessageCreate, AgentMessageOut } from '@/core/api/types'

export function useNovelGroups() {
  return useQuery({
    queryKey: ['novel-groups'],
    queryFn: () => novelGroupsApi.list(),
  })
}

export function useCreateNovelGroup() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (req: NovelGroupCreate) => novelGroupsApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novel-groups'] })
      addToast('success', '分组已创建')
    },
  })
}

export function useUpdateNovelGroup() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: NovelGroupUpdate }) =>
      novelGroupsApi.update(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novel-groups'] })
      addToast('success', '分组已更新')
    },
  })
}

export function useDeleteNovelGroup() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (id: number) => novelGroupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novel-groups'] })
      addToast('success', '分组已删除')
    },
  })
}

// ── Content hooks ─────────────────────────────────────

export function useOutlines(novelId: number) {
  return useQuery({
    queryKey: ['outlines', novelId],
    queryFn: () => http.get<OutlineOut[]>(ENDPOINTS.OUTLINES.LIST(novelId)),
    enabled: !!novelId,
  })
}

export function useCharacters(novelId: number) {
  return useQuery({
    queryKey: ['characters', novelId],
    queryFn: () => http.get<CharacterOut[]>(ENDPOINTS.CHARACTERS.LIST(novelId)),
    enabled: !!novelId,
  })
}

export function useWorldbuilding(novelId: number) {
  return useQuery({
    queryKey: ['worldbuilding', novelId],
    queryFn: () => http.get<WorldbuildingOut[]>(ENDPOINTS.WORLDBUILDING.LIST(novelId)),
    enabled: !!novelId,
  })
}

// ── Agent hooks ───────────────────────────────────────

export function useAgentConfigs(novelId: number) {
  return useQuery({
    queryKey: ['agent-configs', novelId],
    queryFn: () => http.get<AgentConfigOut[]>(ENDPOINTS.AGENT_CONFIGS.LIST(novelId)),
    enabled: !!novelId,
  })
}

export function useAgentSessions(novelId: number) {
  return useQuery({
    queryKey: ['agent-sessions', novelId],
    queryFn: () => http.get<AgentSessionOut[]>(ENDPOINTS.AGENT_SESSIONS.LIST(novelId)),
    enabled: !!novelId,
  })
}

export function useAgentSession(sessionId: number) {
  return useQuery({
    queryKey: ['agent-sessions', sessionId],
    queryFn: () => http.get<AgentSessionDetail>(ENDPOINTS.AGENT_SESSIONS.GET(sessionId)),
    enabled: !!sessionId,
  })
}

export function useCreateAgentSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (req: AgentSessionCreate) =>
      http.post<AgentSessionOut>(ENDPOINTS.AGENT_SESSIONS.CREATE(req.novel_id), req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-sessions', variables.novel_id] })
    },
  })
}

export function useSendAgentMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (req: AgentMessageCreate) =>
      http.post<AgentMessageOut>(ENDPOINTS.AGENT_SESSIONS.MESSAGES(req.session_id), req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-sessions', variables.session_id] })
    },
  })
}

export function useUpsertAgentConfig() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: ({ novelId, req }: { novelId: number; req: AgentConfigUpsert }) =>
      http.post<AgentConfigOut>(ENDPOINTS.AGENT_CONFIGS.UPSERT(novelId), req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs', variables.novelId] })
      addToast('success', 'Agent 配置已更新')
    },
  })
}
