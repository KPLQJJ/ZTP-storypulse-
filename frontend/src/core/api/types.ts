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
  group_id?: number | null
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
  tags: string
  group_id: number | null
  source_type: string
  file_path: string | null
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
  model_id: number
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
  genre_skill_path: string | null
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

// ── Polish ────────────────────────────────────────────

export type PolishStyle = '更流畅' | '更简洁' | '更生动' | '修正语法'

export interface PolishRequest {
  chapter_ids: number[]
  polish_style: string
  model_id: number
}

export interface PolishChapterResult {
  chapter_index: number
  title: string
  original_text: string
  polished_text: string
  changes_summary: string
}

export interface PolishOut {
  id: number
  novel_id: number
  chapter_ids: string
  polish_style: string
  genre_skill_path: string | null
  style_skill_path: string | null
  input_word_count: number
  output_word_count: number
  polish_results: string
  model_used: string | null
  tokens_input: number | null
  tokens_output: number | null
  credits_cost: number | null
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

// ── AI Models ─────────────────────────────────────────

export interface AiModelPublicOut {
  id: number
  name: string
  provider: string
}

export interface AiModelAdminOut extends AiModelPublicOut {
  model_id: string
  provider_id: number | null
  priority: number
  is_fallback: number
  capability_tags: string
  credits_per_1k_input: number
  credits_per_1k_output: number
  is_active: number
  created_at: string
}

export interface AiModelCreate {
  name: string
  provider: string
  model_id: string
  provider_id?: number | null
  priority?: number
  is_fallback?: number
  capability_tags?: string
  credits_per_1k_input?: number
  credits_per_1k_output?: number
}

export interface AiModelUpdate {
  name?: string
  provider?: string
  model_id?: string
  provider_id?: number | null
  priority?: number
  is_fallback?: number
  capability_tags?: string
  credits_per_1k_input?: number
  credits_per_1k_output?: number
}

// ── API Providers ─────────────────────────────────────

export interface ApiProviderPublicOut {
  id: number
  name: string
  display_name: string
  base_url: string
  api_key_masked: string
  is_active: number
  health_status: string
  last_health_check: string | null
  created_at: string
  updated_at: string
}

export interface ApiProviderCreate {
  name: string
  display_name: string
  base_url: string
  api_key: string
}

export interface ApiProviderUpdate {
  name?: string
  display_name?: string
  base_url?: string
  api_key?: string
  is_active?: number
}

// ── Model Preferences ─────────────────────────────────

export type ApplicationType = 'review' | 'polish' | 'writing'

export interface ModelPreferenceOut {
  id: number
  user_id: number
  application_type: ApplicationType
  model_id: number
  novel_id: number | null
  created_at: string
  updated_at: string
}

export interface ModelPreferenceCreate {
  application_type: ApplicationType
  model_id: number
  novel_id?: number | null
}

// ── Novel Groups ──────────────────────────────────────

export interface NovelGroupOut {
  id: number
  user_id: number
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface NovelGroupCreate {
  name: string
}

export interface NovelGroupUpdate {
  name?: string
  sort_order?: number
}

// ── Novels V2 ─────────────────────────────────────────

export interface NovelInitV2 {
  title: string
  genre?: string
  description?: string
  source_type?: string
  tags?: string[]
  group_id?: number | null
}

export interface ImportChapterResult {
  chapter_index: number
  title: string
  word_count: number
  content_preview: string
}

export interface ImportResult {
  novel_id: number
  total_words: number
  chapter_count: number
  chapters: ImportChapterResult[]
  prompts: {
    characters: string
    worldbuilding: string
    summary: string
  }
}

export interface ExportResult {
  novel_id: number
  title: string
  word_count: number
  chapter_count: number
  text: string
}

// ── Outline ───────────────────────────────────────────

export interface OutlineOut {
  id: number
  novel_id: number
  parent_id: number | null
  title: string
  content: string
  sort_order: number
  created_at: string
  updated_at: string
}

// ── Character ─────────────────────────────────────────

export interface CharacterOut {
  id: number
  novel_id: number
  name: string
  description: string
  attributes: string
  created_at: string
  updated_at: string
}

// ── Worldbuilding ─────────────────────────────────────

export interface WorldbuildingOut {
  id: number
  novel_id: number
  category: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

// ── Agent Config ──────────────────────────────────────

export interface AgentConfigOut {
  id: number
  novel_id: number
  agent_role: string
  model_id: number
  created_at: string
  updated_at: string
}

export interface AgentConfigUpsert {
  agent_role: string
  model_id: number
}

// ── Agent Session & Message ───────────────────────────

export interface AgentSessionOut {
  id: number
  novel_id: number
  user_id: number
  context_type: string | null
  context_id: number | null
  title: string | null
  created_at: string
  updated_at: string
}

export interface AgentMessageOut {
  id: number
  session_id: number
  role: string
  agent_name: string | null
  content: string
  tokens: number | null
  meta_json: string
  created_at: string
}

export interface AgentSessionDetail extends AgentSessionOut {
  messages: AgentMessageOut[]
}

export interface AgentSessionCreate {
  novel_id: number
  context_type?: string | null
  context_id?: number | null
  title?: string | null
}

export interface AgentMessageCreate {
  session_id: number
  role: string
  agent_name?: string | null
  content: string
  tokens?: number | null
}
