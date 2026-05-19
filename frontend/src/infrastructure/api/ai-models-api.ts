import { http } from '@/infrastructure/http-client'
import { ENDPOINTS } from '@/core/api/endpoints'
import type { IAiModelApi } from '@/core/api/ai-models'
import type { AiModelPublicOut, AiModelAdminOut, AiModelCreate, AiModelUpdate } from '@/core/api/types'

export const aiModelsApi: IAiModelApi = {
  list: () => http.get<AiModelPublicOut[]>(ENDPOINTS.AI_MODELS.LIST),

  listAll: () => http.get<AiModelAdminOut[]>(ENDPOINTS.AI_MODELS.ADMIN_LIST),

  create: (req: AiModelCreate) =>
    http.post<AiModelAdminOut>(ENDPOINTS.AI_MODELS.ADMIN_CREATE, req),

  update: (id: number, req: AiModelUpdate) =>
    http.patch<AiModelAdminOut>(ENDPOINTS.AI_MODELS.ADMIN_UPDATE(id), req),

  toggle: (id: number, isActive: boolean) =>
    http.patch<AiModelAdminOut>(ENDPOINTS.AI_MODELS.ADMIN_TOGGLE(id), { is_active: isActive }),

  delete: (id: number) => http.delete(ENDPOINTS.AI_MODELS.ADMIN_DELETE(id)),
}
