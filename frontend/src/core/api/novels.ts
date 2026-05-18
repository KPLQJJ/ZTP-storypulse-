import type { NovelCreate, NovelUpdate, NovelOut, NovelDetail } from './types'

export interface INovelApi {
  list(params?: { page?: number; size?: number; search?: string }): Promise<NovelOut[]>
  create(req: NovelCreate): Promise<NovelOut>
  get(novelId: number): Promise<NovelDetail>
  update(novelId: number, req: NovelUpdate): Promise<NovelOut>
  delete(novelId: number): Promise<void>
}
