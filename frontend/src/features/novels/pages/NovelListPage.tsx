import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNovels } from '@/features/novels/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { NOVEL_STATUS_MAP } from '@/core/domain/constants'
import { formatWordCount, formatDate } from '@/core/domain/utils'
import { Plus, Search, BookOpen, Clock, BarChart3 } from 'lucide-react'

export default function NovelListPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const { data: novels, isLoading } = useNovels({ search: search || undefined })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">作品列表</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理你的创作作品
          </p>
        </div>
        <Link to="/novels/new">
          <Button variant="brand" className="gap-2">
            <Plus className="h-4 w-4" />
            新建作品
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索作品标题..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
      </form>

      {/* Novel cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-12 rounded-full ml-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !novels?.length ? (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">还没有作品</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            点击「新建作品」开始创作之旅
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {novels.map((novel) => (
            <Link key={novel.id} to={`/novels/${novel.id}`}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold truncate pr-2">{novel.title}</h3>
                    <Badge variant="secondary" className="shrink-0">{novel.genre}</Badge>
                  </div>
                  {novel.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {novel.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {formatWordCount(novel.word_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(novel.updated_at)}
                    </span>
                    <Badge variant="outline" className="ml-auto">{NOVEL_STATUS_MAP[novel.status]}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
