import { z } from 'zod'

export const novelCreateSchema = z.object({
  title: z
    .string()
    .min(1, '请输入作品标题')
    .max(200, '标题最多 200 字'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const novelUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'ongoing', 'completed']).optional(),
})

export type NovelCreateForm = z.infer<typeof novelCreateSchema>
export type NovelUpdateForm = z.infer<typeof novelUpdateSchema>
