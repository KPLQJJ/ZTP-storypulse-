import { http } from '@/infrastructure/http-client'
import { ENDPOINTS } from '@/core/api/endpoints'
import type { IModelPreferenceApi } from '@/core/api/model-preferences'
import type { ModelPreferenceOut, ModelPreferenceCreate } from '@/core/api/types'

export const modelPreferencesApi: IModelPreferenceApi = {
  list: (novelId?: number) => {
    const params = novelId ? `?novel_id=${novelId}` : ''
    return http.get<ModelPreferenceOut[]>(`${ENDPOINTS.MODEL_PREFERENCES.LIST}${params}`)
  },

  upsert: (req: ModelPreferenceCreate) =>
    http.put<ModelPreferenceOut>(ENDPOINTS.MODEL_PREFERENCES.UPSERT, req),

  delete: (id: number) =>
    http.delete(ENDPOINTS.MODEL_PREFERENCES.DELETE(id)),

  resolve: (applicationType: string, novelId?: number) => {
    const params = new URLSearchParams({ application_type: applicationType })
    if (novelId) params.set('novel_id', String(novelId))
    return http.get(`${ENDPOINTS.MODEL_PREFERENCES.RESOLVE}?${params}`)
  },
}
