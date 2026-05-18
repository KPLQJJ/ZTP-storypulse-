import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { reviewsApi } from '@/infrastructure/api/reviews-api'
import { useToastStore } from '@/infrastructure/stores/toast-store'
import type { ReviewRequest } from '@/core/api/types'

export function useReviews(novelId: number) {
  return useQuery({
    queryKey: ['reviews', novelId],
    queryFn: () => reviewsApi.list(novelId),
    enabled: !!novelId,
  })
}

export function useReview(reviewId: number) {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: () => reviewsApi.get(reviewId),
    enabled: !!reviewId,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)

  return useMutation({
    mutationFn: ({ novelId, req }: { novelId: number; req: ReviewRequest }) =>
      reviewsApi.create(novelId, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['novels'] })
      addToast('success', 'AI 审稿完成')
      navigate(`/reviews/${data.id}`)
    },
  })
}
