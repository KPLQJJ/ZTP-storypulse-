import type { IPolishApi } from '@/core/api/polishes'
import type { PolishRequest, PolishOut } from '@/core/api/types'
import { http } from '@/infrastructure/http-client'

export const polishesApi: IPolishApi = {
  async create(novelId: number, req: PolishRequest): Promise<PolishOut> {
    return http.post<PolishOut>(`/novels/${novelId}/polishes`, req)
  },
  async list(novelId: number): Promise<PolishOut[]> {
    return http.get<PolishOut[]>(`/novels/${novelId}/polishes`)
  },
  async get(polishId: number): Promise<PolishOut> {
    return http.get<PolishOut>(`/polishes/${polishId}`)
  },
}
