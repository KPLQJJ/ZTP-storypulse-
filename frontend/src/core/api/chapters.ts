import type { ChapterDetail, ChapterUpdate, ChapterUploadResponse, ChaptersUploadResponse } from './types'

export interface IChapterApi {
  upload(novelId: number, file: File): Promise<ChapterUploadResponse>
  uploadBatch(novelId: number, files: File[]): Promise<ChaptersUploadResponse>
  get(novelId: number, chapterId: number): Promise<ChapterDetail>
  update(novelId: number, chapterId: number, req: ChapterUpdate): Promise<ChapterDetail>
  delete(novelId: number, chapterId: number): Promise<void>
}
