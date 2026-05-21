import { useParams, Link } from 'react-router-dom'
import { useReview } from '@/features/reviews/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { parseReviewDimensions, formatDate, formatCredits } from '@/core/domain/utils'
import { REVIEW_DIMENSIONS } from '@/core/domain/constants'
import { ArrowLeft, BookOpen, Cpu, Coins, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'

function skillDisplayName(path: string | null | undefined): string | null {
  if (!path) return null
  const parts = path.replace(/\\/g, '/').split('/')
  if (parts.length >= 3) {
    return `${parts[parts.length - 3]}·${parts[parts.length - 2]}`
  }
  return path
}

function ScoreBar({ label, score, comment, suggestions }: {
  label: string
  score: number
  comment: string
  suggestions: string
}) {
  const color = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">{label}</h4>
        <span className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-bold text-white',
          color,
        )}>
          {score}/10
        </span>
      </div>
      <Progress value={score * 10} className="h-2 mb-2" indicatorClassName={color} />
      <p className="text-sm text-foreground mt-3">{comment}</p>
      {suggestions && (
        <p className="text-sm text-brand-600 mt-1.5 bg-brand-50 rounded-lg px-3 py-2">
          建议：{suggestions}
        </p>
      )}
    </div>
  )
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const reviewId = Number(id)
  const { data: review, isLoading } = useReview(reviewId)

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-5 w-24" />
        <Card className="bg-gradient-to-r from-brand-100 to-brand-50/50">
          <CardHeader>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-12 w-20" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Hash className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">审稿报告不存在或已被删除</p>
        <a href="/reviews" className="text-sm text-brand-600 hover:text-brand-700">
          返回审稿历史
        </a>
      </div>
    )
  }

  const dimensions = parseReviewDimensions(review.dimensions)

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/reviews"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回审稿历史
      </Link>

      {/* Overall score */}
      <Card className="mb-6 bg-gradient-to-r from-brand-600 to-brand-800 text-white">
        <CardHeader>
          <CardDescription className="text-white/70">审稿综合评分</CardDescription>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold">{review.overall_score}</span>
            <span className="text-lg text-white/70 mb-1">/ 10</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            {review.genre_skill_path && (
              <Badge variant="outline" className="gap-1 text-white/80 border-white/20">
                <BookOpen className="h-3 w-3" />
                {skillDisplayName(review.genre_skill_path)}
              </Badge>
            )}
            <span className="flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5" />
              {review.model_used}
            </span>
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              输入 {review.tokens_input} · 输出 {review.tokens_output} tokens
            </span>
            {review.credits_cost != null && (
              <span className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" />
                消耗 {formatCredits(review.credits_cost)} 积分
              </span>
            )}
          </div>
          <p className="text-xs text-white/50 mt-3">{formatDate(review.created_at)}</p>
        </CardContent>
      </Card>

      {/* 7 dimensions */}
      <h2 className="text-lg font-semibold mb-4">七维诊断详情</h2>
      <div className="space-y-3">
        {dimensions.length > 0
          ? dimensions.map((dim, i) => (
              <ScoreBar
                key={i}
                label={dim.label}
                score={dim.score}
                comment={dim.comment}
                suggestions={dim.suggestions}
              />
            ))
          : REVIEW_DIMENSIONS.map((dim) => (
              <div key={dim.key} className="text-center py-4 text-muted-foreground text-sm">
                {dim.label}：暂无数据
              </div>
            ))}
      </div>

      {/* Summary */}
      {review.summary && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">综合摘要</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {review.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {review.suggestions && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">优化建议</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {review.suggestions}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
