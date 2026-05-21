export interface BreadcrumbSegment {
  label: string
  path?: string // undefined = current page (non-clickable)
}

const BREADCRUMB_PATTERNS: Array<{
  pattern: RegExp
  build: (match: RegExpMatchArray, dynamicTitle?: string) => BreadcrumbSegment[]
}> = [
  {
    pattern: /^\/workspace$/,
    build: () => [{ label: '工作台' }],
  },
  {
    pattern: /^\/workspace\/novel\/(\d+)$/,
    build: (_, title) => [
      { label: '工作台', path: '/workspace' },
      { label: title || '作品管理' },
    ],
  },
  {
    pattern: /^\/workspace\/novel\/(\d+)\/write$/,
    build: (m, title) => [
      { label: '工作台', path: '/workspace' },
      { label: title || '作品管理', path: `/workspace/novel/${m[1]}` },
      { label: '创作' },
    ],
  },
  {
    pattern: /^\/workspace\/novel\/(\d+)\/polish$/,
    build: (m, title) => [
      { label: '工作台', path: '/workspace' },
      { label: title || '作品管理', path: `/workspace/novel/${m[1]}` },
      { label: '润色' },
    ],
  },
  {
    pattern: /^\/workspace\/novel\/(\d+)\/review$/,
    build: (m, title) => [
      { label: '工作台', path: '/workspace' },
      { label: title || '作品管理', path: `/workspace/novel/${m[1]}` },
      { label: '审稿' },
    ],
  },
  {
    pattern: /^\/write$/,
    build: () => [{ label: '创作中心' }],
  },
  {
    pattern: /^\/write\/novel\/(\d+)$/,
    build: (_, title) => [
      { label: '创作中心', path: '/write' },
      { label: title || '作品创作' },
    ],
  },
  {
    pattern: /^\/polish$/,
    build: () => [{ label: '润色中心' }],
  },
  {
    pattern: /^\/polish\/novel\/(\d+)$/,
    build: (_, title) => [
      { label: '润色中心', path: '/polish' },
      { label: title || '作品润色' },
    ],
  },
  {
    pattern: /^\/review$/,
    build: () => [{ label: '审稿中心' }],
  },
  {
    pattern: /^\/review\/novel\/(\d+)$/,
    build: (_, title) => [
      { label: '审稿中心', path: '/review' },
      { label: title || '发起审稿' },
    ],
  },
  {
    pattern: /^\/reviews\/(\d+)$/,
    build: () => [
      { label: '审稿中心', path: '/review' },
      { label: '审稿报告' },
    ],
  },
  {
    pattern: /^\/credits$/,
    build: () => [{ label: '积分中心' }],
  },
  {
    pattern: /^\/credits\/recharge$/,
    build: () => [
      { label: '积分中心', path: '/credits' },
      { label: '充值' },
    ],
  },
  {
    pattern: /^\/credits\/transactions$/,
    build: () => [
      { label: '积分中心', path: '/credits' },
      { label: '交易流水' },
    ],
  },
  {
    pattern: /^\/profile$/,
    build: () => [{ label: '个人中心' }],
  },
  {
    pattern: /^\/admin\/ai-models$/,
    build: () => [
      { label: '后台管理', path: '/admin/ai-models' },
      { label: '模型管理' },
    ],
  },
  {
    pattern: /^\/admin\/api-providers$/,
    build: () => [
      { label: '后台管理', path: '/admin/api-providers' },
      { label: 'API 账号' },
    ],
  },
]

export function resolveBreadcrumbs(
  pathname: string,
  dynamicTitle?: string,
): BreadcrumbSegment[] {
  for (const { pattern, build } of BREADCRUMB_PATTERNS) {
    const match = pathname.match(pattern)
    if (match) return build(match, dynamicTitle)
  }
  return [{ label: 'StoryPulse' }]
}
