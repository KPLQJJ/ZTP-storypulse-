---
name: architecture-v2-overhaul
description: StoryPulse v2.0 架构重构完整方案 — 从"审稿工具"转型为"网文创作平台"，最高优先级，8阶段实施
metadata:
  type: project
---

# StoryPulse v2.0 架构重构

**决策日期：2026-05-20**
**优先级：最高（当前所有工作以此为准）**
**分支：feature/architecture-v2（计划中，从 dev 切出）**

## 核心转型

从"审稿工具" → "AI 驱动的网文创作平台"。用户打开网站第一眼看到的是工作台，而非作品列表。

## 用户端核心流程

```
打开网站 → 登录
         ↓
      工作台（Workspace）
         ├── 从零开始创作 → 创建作品 → WritePage（VS Code三栏布局）
         ├── 半成品续作 → 上传+AI分析 → WritePage
         ├── 点击作品卡片 → 作品面板（基本信息卡+工坊操作卡）
         │                    ├── 去创作 → WritePage
         │                    ├── 作品润色 → PolishPage
         │                    └── 发起审稿 → ReviewPage
         ├── 创作模块(/write) → 所有作品网格 → 点击 → WritePage
         ├── 润色模块(/polish) → 所有作品网格 → 点击 → PolishPage
         └── 审稿模块(/review) → 所有作品网格 → 点击 → ReviewPage
```

## VS Code 式三栏布局（创作/润色/审稿通用）

```
┌────────────┬─────────────────────┬─────────────┐
│ LEFT (280) │  CENTER (自适应)     │ RIGHT (360) │
│            │                     │             │
│ 大纲树     │  章节编辑器/         │ AgentPanel  │
│ 章节列表   │  润色对比/          │ [对话]      │
│ 角色列表   │  审稿报告           │ [配置]      │
│ 世界观     │                     │             │
│ (历史)     │                     │             │
└────────────┴─────────────────────┴─────────────┘
```

- WritePage 左侧：大纲 + 章节 + 角色 + 世界观
- PolishPage 左侧：章节 + 润色历史（多"历史"）
- ReviewPage 左侧：章节 + 审稿历史（多"历史"）
- 右侧 AgentPanel：对话Tab + 配置Tab（6个Agent角色×模型选择）

## 多 Agent 协作模式

6 个 Agent 角色，每个可独立配置模型：

| Agent 角色 | 职责 | 推荐模型示例 |
|-----------|------|------------|
| outline_writer | 大纲规划 | Claude Sonnet |
| chapter_writer | 章节创作 | DeepSeek / 豆包 |
| world_builder | 世界观构建 | Claude Opus |
| character_designer | 角色设计 | Claude Sonnet |
| polisher | 文字润色 | Qwen |
| reviewer | 七维审稿 | DeepSeek |

配置存储在 `agent_configs` 表（per novel），替换旧的全局 `user_model_preferences`。

## 路由体系

```
/workspace                    → WorkspacePage（工作台首页）
/workspace/novel/:id          → NovelDashboardPage（作品信息卡）
/workspace/novel/:id/write    → WritePage
/workspace/novel/:id/polish   → PolishPage
/workspace/novel/:id/review   → ReviewPage
/write                        → WriteHubPage
/write/novel/:id              → WritePage
/polish                       → PolishHubPage
/polish/novel/:id             → PolishPage
/review                       → ReviewHubPage
/review/novel/:id             → ReviewPage
/credits                      → CreditsPage
/profile                      → ProfilePage
/admin/*                      → Admin pages
```

首页 `/` → 重定向到 `/workspace`

## 删除项

| 删除 | 原因 |
|------|------|
| /settings/models 页面 | 模型配置嵌入 AgentPanel |
| CurrentModelBadge 组件 | 同上 |
| /workshop/create 占位页 | 替换为 WritePage |
| NovelListPage | 合并入 WorkspacePage |
| NovelCreatePage | 合并入 WorkspacePage 创作卡片 |
| 润色风格选择（4种） | 用户不需要，后期用Skill配置 |
| 旧侧边栏"创作管理"菜单 | 合并为"工作台" |

## 数据库变更

### 新建 6 表

- `novel_groups` — 作品分组（user_id, name, sort_order）
- `outlines` — 大纲树（novel_id, parent_id自引用, title, content）
- `characters` — 角色卡（novel_id, name, description, attributes JSON）
- `worldbuilding` — 世界观条目（novel_id, category, title, content）
- `agent_sessions` — Agent会话（novel_id, user_id, context_type, context_id）
- `agent_messages` — 会话消息（session_id, role, agent_name, content, tokens, metadata）
- `agent_configs` — Agent模型配置（novel_id, agent_role, model_id, UNIQUE约束）

### novels 表扩展

- `tags` TEXT — JSON数组，网文理解标签（热血/穿越/系统流等）
- `group_id` FK → novel_groups
- `source_type` TEXT — from_scratch / import / manual
- `file_path` TEXT — 半成品上传路径

### polishes 表修改

- `polish_style` 字段改为可空，移除 CHECK 约束

## 8 阶段实施计划

### Phase 0: 安全准备
- 创建 feature/architecture-v2 分支
- 备份数据库
- 确认构建通过

### Phase 1: 数据库基础
- init.sql 新增 6 表 + ALTER novels/polishes
- ORM 模型 + Pydantic Schema 全部就位

### Phase 2: 后端核心服务
- 8 个新模块（novel_groups / outlines / characters / worldbuilding / agent_sessions / agent_orchestrator / import_analyzer / export_service）
- novels.py 新增 initV2（Path A从零+Path B导入含AI分析）+ export 端点
- polishes.py 移除风格要求
- main.py 注册所有新路由

### Phase 3: 前端基础组件 + 路由
- 9 个共享组件（ThreePanelLayout / LeftSidebar / ChapterEditor / AgentPanel / NovelCard / NovelGrid / GroupTabs / CreationCards / CreationDialog）
- 完全重写 router.tsx
- 重写 Sidebar.tsx 菜单结构
- 补充所有类型定义和 API 实现

### Phase 4: 工作台 + 作品面板
- WorkspacePage（大字标题 + 创作卡片 + 分组标签 + 作品网格）
- NovelDashboardPage（信息卡 + 工坊操作卡）
- CreationDialog（Path A / Path B 双表单）

### Phase 5: WritePage
- 三栏布局完整实现
- 左侧栏（大纲树/章节/角色/世界观）
- ChapterEditor（自动保存+字数统计+章节导航）
- AgentPanel（对话+配置双Tab）

### Phase 6: 润色/审稿重构
- PolishPage VS Code 布局（左侧+章节历史）
- ReviewPage VS Code 布局（左侧+审稿历史）
- 润色风格选择全面移除

### Phase 7: Hub 页面
- WriteHubPage / PolishHubPage / ReviewHubPage
- 复用 NovelGrid 组件

### Phase 8: 清理验证
- 删除 5 个过期文件 + 2 个过期路由
- 数据迁移脚本
- 全链路端到端验证

## 保留不变

- Auth（JWT cookie / 2FA / 限流）
- Credits（积分余额 / 充值 / 流水）
- AI Models CRUD（后台管理）
- API Providers（多平台 Key 管理）
- Skill Registry（skills/ 目录扫描）
- Review Engine（review_service.py 含缓存/重试/断路器）
- Polish Engine（polish_service.py）
- 安全管理（AdminGuard / 审计日志 / 错误脱敏）
- "纸墨书香"设计系统（暖色调 / 宋体标题 / 纸纤维纹理）

## 侧边栏新结构

```
工作台 (/workspace)
───
功能模块
  创作 (/write)
  润色 (/polish)
  审稿 (/review)
───
积分中心
  积分余额 (/credits)
  交易流水 (/credits/transactions)
───
账户
  个人中心 (/profile)
───
后台管理（仅admin）
  模型管理 (/admin/ai-models)
  API账号 (/admin/api-providers)
```

## Path B 半成品导入 AI 分析（import_analyzer.py）

用户上传半成品文件后的自动分析流程：
1. **文件预处理**：合并多文件，检测编码，提取纯文本
2. **章节识别**：正则匹配标题模式（"第X章"等），无标题则按~3000字切分 → 生成 Chapter 记录
3. **角色提取**（AI）：提取角色名称、特征描述 → 写入 Characters 表
4. **世界观识别**（AI）：识别力量体系/地理/历史/社会组织关键词 → 写入 Worldbuilding 表
5. **内容概要**（AI）：概括风格、主线方向 → 写入 Novel.description
6. 分析报告返回前端 → WritePage 展示已自动填充的大纲/角色/世界观/章节

文件仅在初始化时上传一次，后续创作完全在平台进行。

## NovelCard 设计规格

```
┌─────────────────────────────────┐
│     [封面图片区 16:9]           │
│  (无封面：暖色渐变 +             │
│   作品名首字大字水印 +           │
│   text-shadow 暖光)             │
│ ┌─────────────────────────────┐ │
│ │ 作品名   字数：12.3万字     │ │
│ │ 标签Chip 更新：2026-05-20  │ │ ← 封面内底部半透明叠加
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [更换封面]  [下载]  [删除]     │ ← 封面外右侧操作栏
└─────────────────────────────────┘
```

- 无封面默认：暖色渐变(brand-50→brand-100) + 首字水印(4rem, opacity 0.3, text-shadow 暖光)
- 悬停效果：scale 1.02 + 阴影加深
- 点击封面 → NovelDashboardPage
- "工作台" 标题：~2.5rem bold，CSS text-shadow 暖光（brand-300/50%）

## 关联记忆

- [[storypulse-project]] — 项目总览
- [[architecture-server-centric]] — 服务端为中心架构决策
- [[storypulse-design-principles]] — 15条界面设计规范
- [[admin-models-plan]] — AI模型后台已实现
- [[api-account-management-plan]] — API账号管理方案

## 已知待定

- 会员体系（后续 Phase）
- PostgreSQL 迁移（后续 Phase）
- 润色 Skill 灵活配置（替代风格选择，后期）
- Agent 角色可扩展（硬编码6个角色，后期可配置化）
