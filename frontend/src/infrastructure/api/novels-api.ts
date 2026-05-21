import type { INovelApi } from '@/core/api/novels'
import type { NovelCreate, NovelUpdate, NovelOut, NovelDetail, NovelInitV2, ImportResult, ExportResult } from '@/core/api/types'
import { http } from '@/infrastructure/http-client'
import { ENDPOINTS } from '@/core/api/endpoints'

export const novelsApi: INovelApi = {
  async list(params = {}): Promise<NovelOut[]> {
    const searchParams = new URLSearchParams()
    if (params.page) searchParams.set('page', String(params.page))
    if (params.size) searchParams.set('size', String(params.size))
    if (params.search) searchParams.set('search', params.search)
    const qs = searchParams.toString()
    return http.get<NovelOut[]>(`/novels${qs ? `?${qs}` : ''}`)
  },

  async create(req: NovelCreate): Promise<NovelOut> {
    return http.post<NovelOut>('/novels', req)
  },

  async get(novelId: number): Promise<NovelDetail> {
    return http.get<NovelDetail>(`/novels/${novelId}`)
  },

  async update(novelId: number, req: NovelUpdate): Promise<NovelOut> {
    return http.patch<NovelOut>(`/novels/${novelId}`, req)
  },

  async delete(novelId: number): Promise<void> {
    return http.delete(`/novels/${novelId}`)
  },

  async initV2(req: NovelInitV2): Promise<NovelOut> {
    return http.post<NovelOut>(ENDPOINTS.NOVELS_V2.INIT, req)
  },

  async importFile(novelId: number, file: File): Promise<ImportResult> {
    return http.upload<ImportResult>(ENDPOINTS.NOVELS_V2.IMPORT(novelId), file)
  },

  async exportNovel(novelId: number): Promise<ExportResult> {
    return http.get<ExportResult>(ENDPOINTS.NOVELS_V2.EXPORT(novelId))
  },
}
