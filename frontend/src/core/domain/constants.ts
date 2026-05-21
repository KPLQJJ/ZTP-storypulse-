export const REVIEW_DIMENSIONS = [
  { key: 'market', label: '整体判断与市场定位' },
  { key: 'hook', label: '开篇钩子与黄金三章' },
  { key: 'style', label: '文笔与AI味道检测' },
  { key: 'pacing', label: '节奏与爽点投放' },
  { key: 'character', label: '人物塑造与关系张力' },
  { key: 'worldbuilding', label: '金手指与世界观' },
  { key: 'retention', label: '追读钩子与章节留扣' },
] as const

export const POLISH_STYLES = [
  { value: '更流畅' as const, label: '更流畅', description: '让文字更加流畅自然，优化节奏感和可读性' },
  { value: '更简洁' as const, label: '更简洁', description: '精简冗余表达，让文字简洁有力' },
  { value: '更生动' as const, label: '更生动', description: '增强画面感和感染力，丰富细节描写' },
  { value: '修正语法' as const, label: '修正语法', description: '修正语法错误和表达问题' },
] as const

export const NOVEL_STATUS_MAP: Record<string, string> = {
  draft: '草稿',
  ongoing: '连载中',
  completed: '已完结',
}
