import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { novelCreateSchema, type NovelCreateForm } from '@/core/schema/novel'
import { useCreateNovel } from '@/features/novels/hooks'
import { NOVEL_GENRES } from '@/core/domain/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function NovelCreatePage() {
  const createNovel = useCreateNovel()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NovelCreateForm>({
    resolver: zodResolver(novelCreateSchema),
    defaultValues: { description: '' },
  })

  const genreValue = watch('genre')

  function onSubmit(data: NovelCreateForm) {
    createNovel.mutate({
      title: data.title,
      genre: data.genre,
      description: data.description || '',
    })
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link
        to="/novels"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回作品列表
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>新建作品</CardTitle>
          <CardDescription>填写作品基本信息，开始 AI 创作之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="title">
                作品标题 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="给你的作品起个名字"
                {...register('title')}
                className="mt-1.5"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="genre">
                作品类型 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={genreValue}
                onValueChange={(v) => setValue('genre', v, { shouldValidate: true })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="请选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {NOVEL_GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.genre && (
                <p className="mt-1 text-xs text-destructive">{errors.genre.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">作品简介</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="简单介绍一下你的作品..."
                {...register('description')}
                className="mt-1.5"
              />
            </div>

            {createNovel.error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {createNovel.error instanceof Error
                  ? createNovel.error.message
                  : '创建失败'}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={createNovel.isPending}
                variant="brand"
              >
                {createNovel.isPending ? '创建中...' : '创建作品'}
              </Button>
              <Link to="/novels">
                <Button variant="outline" type="button">
                  取消
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
