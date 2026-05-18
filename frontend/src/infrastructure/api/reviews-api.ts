import type { IReviewApi } from '@/core/api/reviews'
import type { ReviewRequest, ReviewOut } from '@/core/api/types'
import { http } from '@/infrastructure/http-client'

export const reviewsApi: IReviewApi = {
  async create(novelId: number, req: ReviewRequest): Promise<ReviewOut> {
    return http.post<ReviewOut>(`/novels/${novelId}/reviews`, req)
  },

  async list(novelId: number): Promise<ReviewOut[]> {
    return http.get<ReviewOut[]>(`/novels/${novelId}/reviews`)
  },

  async get(reviewId: number): Promise<ReviewOut> {
    return http.get<ReviewOut>(`/reviews/${reviewId}`)
  },
}
