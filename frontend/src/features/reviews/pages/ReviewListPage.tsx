import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNovels } from '@/features/novels/hooks'
import { useReviews } from '@/features/reviews/hooks'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, parseReviewDimensions } from '@/core/domain/utils'
import { Sparkles, FileText, Star } from 'lucide-react'

export default function ReviewListPage() {
  const { data: novels } = useNovels()
  const [selectedNovelId, setSelectedNovelId] = useState<number | null>(null)
  const { data: reviews, isLoading } = useReviews(selectedNovelId ?? 0)

  const selectedNovel = novels?.find((n) => n.id === selectedNovelId)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">审稿历史</h1>
        <p className="text-sm text-muted-foreground mt-1">
          查看作品的 AI 审稿记录
        </p>
      </div>

      {/* Select novel */}
      <div className="mb-6 max-w-xs">
        <Select
          value={selectedNovelId?.toString() ?? ''}
          onValueChange={(v) => setSelectedNovelId(v ? Number(v) : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择作品" />
          </SelectTrigger>
          <SelectContent>
            {novels?.map((n) => (
              <SelectItem key={n.id} value={String(n.id)}>
                {n.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reviews */}
      {!selectedNovelId ? (
        <div className="text-center py-16">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">请先选择一个作品查看审稿记录</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-64" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !reviews?.length ? (
        <div className="text-center py-16">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">该作品暂无审稿记录</p>
          <Link
            to={`/reviews/new?novel=${selectedNovelId}`}
            className="text-sm text-brand-600 hover:text-brand-700 mt-1 inline-block"
          >
            发起第一次审稿
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const dimensions = parseReviewDimensions(review.dimensions)
            return (
              <Link key={review.id} to={`/reviews/${review.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {selectedNovel?.title ?? '作品'} · 审稿报告
                      </CardTitle>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-bold">
                          {review.overall_score}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {dimensions.slice(0, 4).map((d) => (
                        <Badge key={d.label} variant="secondary">
                          {d.label}: {d.score}
                        </Badge>
                      ))}
                      {dimensions.length > 4 && (
                        <Badge variant="secondary">+{dimensions.length - 4}</Badge>
                      )}
                    </div>
                    {review.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {review.summary}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>模型：{review.model_used}</span>
                      {review.credits_cost != null && (
                        <span>消耗：{review.credits_cost} 积分</span>
                      )}
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
