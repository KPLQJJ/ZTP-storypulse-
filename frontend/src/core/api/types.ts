// ── Auth ──────────────────────────────────────────────

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: number
  username: string
  role: string
}

export interface UserOut {
  id: number
  username: string
  email: string
  role: string
  is_active: number
  created_at: string
}

// ── Novel ─────────────────────────────────────────────

export type NovelStatus = 'draft' | 'ongoing' | 'completed'

export interface NovelCreate {
  title: string
  genre: string
  description?: string
}

export interface NovelUpdate {
  title?: string
  genre?: string
  description?: string
  status?: NovelStatus
}

export interface NovelOut {
  id: number
  user_id: number
  title: string
  genre: string
  description: string | null
  status: NovelStatus
  word_count: number
  cover_url: string | null
  created_at: string
  updated_at: string
}

export interface NovelDetail extends NovelOut {
  chapters: ChapterOut[]
}

// ── Chapter ───────────────────────────────────────────

export interface ChapterOut {
  id: number
  novel_id: number
  chapter_index: number
  title: string
  word_count: number
  status: string
  source: string
  file_format: string | null
  created_at: string
}

export interface ChapterUploadResponse {
  message: string
  chapter: ChapterOut
}

export interface ChaptersUploadResponse {
  message: string
  chapters: ChapterOut[]
  errors: string[]
}

export interface ChapterDetail extends ChapterOut {
  content: string
  content_hash: string | null
  updated_at: string
}

export interface ChapterUpdate {
  title?: string
  content?: string
}

// ── Review ────────────────────────────────────────────

export interface ReviewRequest {
  chapter_ids: number[]
  model_name: string
}

export interface DimensionScore {
  label: string
  score: number
  comment: string
  suggestions: string
}

export interface ReviewOut {
  id: number
  novel_id: number
  chapter_ids: string
  overall_score: number
  dimensions: string
  model_used: string | null
  tokens_input: number | null
  tokens_output: number | null
  credits_cost: number | null
  summary: string | null
  suggestions: string | null
  reviewer_type: string
  status: string
  created_at: string
}

// ── Credits ───────────────────────────────────────────

export interface RechargeRequest {
  amount: number
  description?: string
}

export interface BalanceResponse {
  user_id: number
  balance: number
}

export interface TransactionOut {
  id: number
  user_id: number
  amount: number
  balance_after: number
  type: string
  reference_type: string | null
  reference_id: number | null
  description: string | null
  created_at: string
}

// ── Pagination ────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}
