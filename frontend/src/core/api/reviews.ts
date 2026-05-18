import type { ReviewRequest, ReviewOut } from './types'

export interface IReviewApi {
  create(novelId: number, req: ReviewRequest): Promise<ReviewOut>
  list(novelId: number): Promise<ReviewOut[]>
  get(reviewId: number): Promise<ReviewOut>
}
