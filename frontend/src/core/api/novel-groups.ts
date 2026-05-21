import type { NovelGroupOut, NovelGroupCreate, NovelGroupUpdate } from './types'

export interface INovelGroupApi {
  list(): Promise<NovelGroupOut[]>
  create(req: NovelGroupCreate): Promise<NovelGroupOut>
  update(id: number, req: NovelGroupUpdate): Promise<NovelGroupOut>
  delete(id: number): Promise<void>
}
