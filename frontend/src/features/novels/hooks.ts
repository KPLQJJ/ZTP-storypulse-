import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { novelsApi } from '@/infrastructure/api/novels-api'
import { chaptersApi } from '@/infrastructure/api/chapters-api'
import { useToastStore } from '@/infrastructure/stores/toast-store'
import type { NovelCreate, NovelUpdate, ChapterUpdate } from '@/core/api/types'

export function useNovels(params?: { page?: number; size?: number; search?: string }) {
  return useQuery({
    queryKey: ['novels', params],
    queryFn: () => novelsApi.list(params),
  })
}

export function useNovel(novelId: number) {
  return useQuery({
    queryKey: ['novels', novelId],
    queryFn: () => novelsApi.get(novelId),
    enabled: !!novelId,
  })
}

export function useCreateNovel() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (req: NovelCreate) => novelsApi.create(req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['novels'] })
      addToast('success', '作品创建成功')
      navigate(`/novels/${data.id}`)
    },
  })
}

export function useUpdateNovel(novelId: number) {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (req: NovelUpdate) => novelsApi.update(novelId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novels', novelId] })
      queryClient.invalidateQueries({ queryKey: ['novels'] })
      addToast('success', '作品已更新')
    },
  })
}

export function useDeleteNovel() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (novelId: number) => novelsApi.delete(novelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novels'] })
      addToast('success', '作品已删除')
      navigate('/novels')
    },
  })
}

// ── Chapter hooks ──────────────────────────────────────

export function useChapter(novelId: number, chapterId: number) {
  return useQuery({
    queryKey: ['chapters', novelId, chapterId],
    queryFn: () => chaptersApi.get(novelId, chapterId),
    enabled: !!novelId && !!chapterId,
  })
}

export function useUpdateChapter(novelId: number) {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: ({ chapterId, req }: { chapterId: number; req: ChapterUpdate }) =>
      chaptersApi.update(novelId, chapterId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novels', novelId] })
      queryClient.invalidateQueries({ queryKey: ['chapters', novelId] })
      addToast('success', '章节已更新')
    },
  })
}

export function useDeleteChapter(novelId: number) {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: (chapterId: number) => chaptersApi.delete(novelId, chapterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novels', novelId] })
      addToast('success', '章节已删除')
    },
  })
}
