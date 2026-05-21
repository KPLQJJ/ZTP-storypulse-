import type { NovelCreate, NovelUpdate, NovelOut, NovelDetail, NovelInitV2, ImportResult, ExportResult } from './types'

export interface INovelApi {
  list(params?: { page?: number; size?: number; search?: string }): Promise<NovelOut[]>
  create(req: NovelCreate): Promise<NovelOut>
  get(novelId: number): Promise<NovelDetail>
  update(novelId: number, req: NovelUpdate): Promise<NovelOut>
  delete(novelId: number): Promise<void>
  initV2(req: NovelInitV2): Promise<NovelOut>
  importFile(novelId: number, file: File): Promise<ImportResult>
  exportNovel(novelId: number): Promise<ExportResult>
}
