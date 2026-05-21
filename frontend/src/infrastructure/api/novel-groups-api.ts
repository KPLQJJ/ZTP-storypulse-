import type { INovelGroupApi } from '@/core/api/novel-groups'
import type { NovelGroupOut, NovelGroupCreate, NovelGroupUpdate } from '@/core/api/types'
import { http } from '@/infrastructure/http-client'
import { ENDPOINTS } from '@/core/api/endpoints'

export const novelGroupsApi: INovelGroupApi = {
  async list(): Promise<NovelGroupOut[]> {
    return http.get<NovelGroupOut[]>(ENDPOINTS.NOVEL_GROUPS.LIST)
  },

  async create(req: NovelGroupCreate): Promise<NovelGroupOut> {
    return http.post<NovelGroupOut>(ENDPOINTS.NOVEL_GROUPS.CREATE, req)
  },

  async update(id: number, req: NovelGroupUpdate): Promise<NovelGroupOut> {
    return http.patch<NovelGroupOut>(ENDPOINTS.NOVEL_GROUPS.UPDATE(id), req)
  },

  async delete(id: number): Promise<void> {
    return http.delete(ENDPOINTS.NOVEL_GROUPS.DELETE(id))
  },
}
