import type { PolishRequest, PolishOut } from './types'

export interface IPolishApi {
  create(novelId: number, req: PolishRequest): Promise<PolishOut>
  list(novelId: number): Promise<PolishOut[]>
  get(polishId: number): Promise<PolishOut>
}
