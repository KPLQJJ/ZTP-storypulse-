export const REVIEW_DIMENSIONS = [
  { key: 'market', label: '整体判断与市场定位' },
  { key: 'hook', label: '开篇钩子与黄金三章' },
  { key: 'style', label: '文笔与AI味道检测' },
  { key: 'pacing', label: '节奏与爽点投放' },
  { key: 'character', label: '人物塑造与关系张力' },
  { key: 'worldbuilding', label: '金手指与世界观' },
  { key: 'retention', label: '追读钩子与章节留扣' },
] as const

export const AI_MODELS = [
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', creditsPer1kInput: 1, creditsPer1kOutput: 2 },
] as const

export const NOVEL_GENRES = [
  '玄幻', '奇幻', '武侠', '仙侠', '都市', '现实',
  '历史', '军事', '游戏', '体育', '科幻', '悬疑',
  '轻小说', '短篇', '其他',
] as const

export const NOVEL_STATUS_MAP: Record<string, string> = {
  draft: '草稿',
  ongoing: '连载中',
  completed: '已完结',
}
