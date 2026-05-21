export interface WebNovelTag {
  key: string
  label: string
  popular: boolean
}

export interface TagCategory {
  key: string
  label: string
  tags: WebNovelTag[]
}

export const TAG_CATEGORIES: TagCategory[] = [
  {
    key: 'popular',
    label: '热门标签',
    tags: [
      { key: 'time_travel', label: '穿越', popular: true },
      { key: 'rebirth', label: '重生', popular: true },
      { key: 'system', label: '系统流', popular: true },
      { key: 'power_up', label: '升级流', popular: true },
      { key: 'feel_good', label: '爽文', popular: true },
      { key: 'hidden_power', label: '扮猪吃虎', popular: true },
      { key: 'invincible', label: '无敌流', popular: true },
      { key: 'cultivation', label: '修真修仙', popular: true },
      { key: 'eastern_fantasy', label: '东方玄幻', popular: true },
      { key: 'modern_urban', label: '现代都市', popular: true },
    ],
  },
  {
    key: 'world',
    label: '世界观与背景',
    tags: [
      { key: 'eastern_fantasy', label: '东方玄幻', popular: true },
      { key: 'western_fantasy', label: '西方奇幻', popular: false },
      { key: 'apocalypse', label: '末日废土', popular: false },
      { key: 'scifi', label: '星际科幻', popular: false },
      { key: 'modern_urban', label: '现代都市', popular: true },
      { key: 'ancient_history', label: '古代历史', popular: false },
      { key: 'alt_history', label: '架空历史', popular: false },
      { key: 'other_world', label: '异世界', popular: false },
      { key: 'game_world', label: '游戏世界', popular: false },
      { key: 'infinite_flow', label: '无限流', popular: false },
      { key: 'cyberpunk', label: '赛博朋克', popular: false },
      { key: 'cthulhu', label: '克苏鲁', popular: false },
    ],
  },
  {
    key: 'power_system',
    label: '修炼与力量体系',
    tags: [
      { key: 'cultivation', label: '修真修仙', popular: true },
      { key: 'martial_arts', label: '武道修炼', popular: false },
      { key: 'magic', label: '魔法斗气', popular: false },
      { key: 'esper', label: '异能觉醒', popular: false },
      { key: 'system', label: '系统流', popular: true },
      { key: 'litrpg', label: '数据流', popular: false },
      { key: 'bloodline', label: '血脉觉醒', popular: false },
      { key: 'luck', label: '气运流', popular: false },
      { key: 'comprehension', label: '悟性逆天', popular: false },
    ],
  },
  {
    key: 'protagonist',
    label: '主角特征',
    tags: [
      { key: 'time_travel', label: '穿越', popular: true },
      { key: 'rebirth', label: '重生', popular: true },
      { key: 'return_strong', label: '强者归来', popular: false },
      { key: 'hidden_power', label: '扮猪吃虎', popular: true },
      { key: 'ruthless', label: '杀伐果断', popular: false },
      { key: 'smart', label: '智谋', popular: false },
      { key: 'cautious', label: '苟道', popular: false },
      { key: 'steady', label: '稳健流', popular: false },
      { key: 'invincible', label: '无敌流', popular: true },
      { key: 'mortal', label: '凡人流', popular: false },
      { key: 'underdog', label: '废柴逆袭', popular: false },
      { key: 'scheming', label: '腹黑', popular: false },
      { key: 'behind_scenes', label: '幕后流', popular: false },
    ],
  },
  {
    key: 'genre_type',
    label: '故事类型与流派',
    tags: [
      { key: 'power_up', label: '升级流', popular: true },
      { key: 'farming', label: '种田流', popular: false },
      { key: 'management', label: '经营流', popular: false },
      { key: 'academy', label: '书院流', popular: false },
      { key: 'primordial', label: '洪荒流', popular: false },
      { key: 'multiverse', label: '诸天流', popular: false },
      { key: 'fanfic', label: '同人', popular: false },
      { key: 'original', label: '原创', popular: false },
      { key: 'villain', label: '反派流', popular: false },
      { key: 'checkin', label: '签到流', popular: false },
      { key: 'simulator', label: '模拟器', popular: false },
      { key: 'chat_group', label: '聊天群', popular: false },
      { key: 'fourth_wall', label: '第四天灾', popular: false },
    ],
  },
  {
    key: 'mood',
    label: '情感与氛围',
    tags: [
      { key: 'hot_blooded', label: '热血', popular: false },
      { key: 'relaxed', label: '轻松', popular: false },
      { key: 'funny', label: '搞笑', popular: false },
      { key: 'suspense', label: '悬疑', popular: false },
      { key: 'horror', label: '惊悚', popular: false },
      { key: 'mystery', label: '推理', popular: false },
      { key: 'pure_love', label: '纯爱', popular: false },
      { key: 'harem', label: '后宫', popular: false },
      { key: 'single_heroine', label: '单女主', popular: false },
      { key: 'no_cp', label: '无CP', popular: false },
      { key: 'dark', label: '黑暗', popular: false },
      { key: 'healing', label: '治愈', popular: false },
      { key: 'tragic', label: '虐心', popular: false },
      { key: 'rule_horror', label: '规则怪谈', popular: false },
      { key: 'weird', label: '诡异', popular: false },
    ],
  },
]

export const ALL_TAGS: WebNovelTag[] = TAG_CATEGORIES.flatMap((c) => c.tags)

export const POPULAR_TAGS: WebNovelTag[] = TAG_CATEGORIES[0].tags

export const TAGS_BY_KEY: Record<string, WebNovelTag> = {}
ALL_TAGS.forEach((t) => {
  TAGS_BY_KEY[t.key] = t
})
