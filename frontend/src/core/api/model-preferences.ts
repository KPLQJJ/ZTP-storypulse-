import type { ModelPreferenceOut, ModelPreferenceCreate } from './types'

export interface IModelPreferenceApi {
  list(novelId?: number): Promise<ModelPreferenceOut[]>
  upsert(req: ModelPreferenceCreate): Promise<ModelPreferenceOut>
  delete(id: number): Promise<void>
  resolve(applicationType: string, novelId?: number): Promise<{
    model_id: number
    model_name: string
    provider: string
    application_type: string
    source: string
    novel_id: number | null
  }>
}
