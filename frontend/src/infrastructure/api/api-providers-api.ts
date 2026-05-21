import { http } from '@/infrastructure/http-client'
import { ENDPOINTS } from '@/core/api/endpoints'
import type { IApiProviderApi } from '@/core/api/api-providers'
import type { ApiProviderPublicOut, ApiProviderCreate, ApiProviderUpdate } from '@/core/api/types'

export const apiProvidersApi: IApiProviderApi = {
  list: () => http.get<ApiProviderPublicOut[]>(ENDPOINTS.API_PROVIDERS.ADMIN_LIST),

  create: (req: ApiProviderCreate) =>
    http.post<ApiProviderPublicOut>(ENDPOINTS.API_PROVIDERS.ADMIN_CREATE, req),

  get: (id: number) =>
    http.get<ApiProviderPublicOut>(ENDPOINTS.API_PROVIDERS.ADMIN_DETAIL(id)),

  update: (id: number, req: ApiProviderUpdate) =>
    http.patch<ApiProviderPublicOut>(ENDPOINTS.API_PROVIDERS.ADMIN_UPDATE(id), req),

  delete: (id: number) =>
    http.delete(ENDPOINTS.API_PROVIDERS.ADMIN_DELETE(id)),

  test: (id: number) =>
    http.post(ENDPOINTS.API_PROVIDERS.ADMIN_TEST(id)),
}
