import type { ApiProviderPublicOut, ApiProviderCreate, ApiProviderUpdate } from './types'

export interface IApiProviderApi {
  list(): Promise<ApiProviderPublicOut[]>
  create(req: ApiProviderCreate): Promise<ApiProviderPublicOut>
  get(id: number): Promise<ApiProviderPublicOut>
  update(id: number, req: ApiProviderUpdate): Promise<ApiProviderPublicOut>
  delete(id: number): Promise<void>
  test(id: number): Promise<{ status: string; http_status?: number; detail?: string; error?: string }>
}
