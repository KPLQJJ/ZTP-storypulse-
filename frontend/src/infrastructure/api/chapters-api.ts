import type { IChapterApi } from '@/core/api/chapters'
import type { ChapterDetail, ChapterUpdate, ChapterUploadResponse, ChaptersUploadResponse } from '@/core/api/types'
import { http } from '@/infrastructure/http-client'

export const chaptersApi: IChapterApi = {
  async upload(novelId: number, file: File): Promise<ChapterUploadResponse> {
    return http.upload<ChapterUploadResponse>(`/novels/${novelId}/chapters/upload`, file)
  },

  async uploadBatch(novelId: number, files: File[]): Promise<ChaptersUploadResponse> {
    return http.uploadMultiple<ChaptersUploadResponse>(
      `/novels/${novelId}/chapters/upload/batch`,
      files,
    )
  },

  async get(novelId: number, chapterId: number): Promise<ChapterDetail> {
    return http.get<ChapterDetail>(`/novels/${novelId}/chapters/${chapterId}`)
  },

  async update(novelId: number, chapterId: number, req: ChapterUpdate): Promise<ChapterDetail> {
    return http.patch<ChapterDetail>(`/novels/${novelId}/chapters/${chapterId}`, req)
  },

  async delete(novelId: number, chapterId: number): Promise<void> {
    return http.delete(`/novels/${novelId}/chapters/${chapterId}`)
  },
}
