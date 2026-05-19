import type { AiModelPublicOut, AiModelAdminOut, AiModelCreate, AiModelUpdate } from './types'

export interface IAiModelApi {
  list(): Promise<AiModelPublicOut[]>
  listAll(): Promise<AiModelAdminOut[]>
  create(req: AiModelCreate): Promise<AiModelAdminOut>
  update(id: number, req: AiModelUpdate): Promise<AiModelAdminOut>
  toggle(id: number, isActive: boolean): Promise<AiModelAdminOut>
  delete(id: number): Promise<void>
}
