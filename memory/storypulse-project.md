---
name: storypulse-project
description: StoryPulse — AI网文创作审稿平台，安全加固+模型后台+2FA后端已完成（前端2FA待开发），前端5173/后端8765可运行，Phase A素材采集+Phase B悬疑Skill已完成
metadata:
  node_type: memory
  type: project
  originSessionId: 4c9db041-bb92-4c06-8ae3-a7b947883da6
---

# StoryPulse — AI 网文创作审稿平台

## 项目定位
AI 驱动的网文创作审稿平台，核心差异化功能为七维诊断审稿系统。

## 最高优先级原则：安全底线（Security Baseline）

**本网站为商业化盈利性产品，以下安全红线不可妥协，所有开发决策必须优先满足：**

1. **数据资产保护**
   - 用户数据（账号、作品、审稿内容）为平台核心资产，任何功能不得以明文或可反推形式泄露
   - API 密钥、模型内部标识符（model_id）、定价结构仅限服务端使用，**绝对禁止**出现在前端代码、公开接口响应、日志或错误消息中
   - 所有敏感配置（JWT 密钥、数据库密码、第三方 API Key）必须通过环境变量注入，禁止硬编码或提交到版本控制

2. **API 与模型资产管理**
   - AI 模型为平台核心生产资料，其内部标识符（如 `deepseek-v4-pro`）和成本定价（credits per 1k tokens）属商业机密
   - 前端只持有模型的整数 ID，后端通过 ID 反查内部信息；公开接口只返回展示名称和供应商
   - 所有管理操作（创建/修改/启停/删除模型）必须有审计日志（操作人、时间、IP、具体变更内容）

3. **权限与访问控制**
   - 管理接口（`/admin/*`）必须双重守卫：JWT 认证 + 角色校验（`role == 'admin'`）
   - 用户只能操作自己的资源（作品、章节、审稿记录），所有权校验不可遗漏
   - 前端路由同样需要 AuthGuard + AdminGuard 两层保护

4. **运行时防护**
   - 所有端点必须有速率限制（公开接口宽松、认证接口严格、管理接口最严）
   - 错误响应脱敏：500/502 等异常只返回通用消息，具体错误只写服务端日志
   - 安全头（CSP、HSTS、X-Frame-Options、X-Content-Type-Options 等）全局启用

5. **代码审查检查点**
   - 每次新增 API 端点：确认鉴权方式、限流策略、响应字段是否泄露敏感信息
   - 每次前端改动：确认 Network 面板不会暴露 `model_id`、定价、内部路径
   - 每次涉及积分/余额操作：确认有 FOR UPDATE 锁或等效并发保护

**违反以上任何一条的实现不得合并到 dev 分支。**

## 团队
- 赵景锋 — 开发（后端 + 数据库）
- 钟振华 — 产品 & 审稿 Prompt
- 潘智 — 运营推广

## 技术栈
- Backend: Python + FastAPI + SQLAlchemy + SQLite（开发用）+ slowapi + pyotp + pydantic-settings
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui (New York)
- 关键依赖: React Router v7, TanStack Query v5, Zustand, React Hook Form + Zod, Lucide React
- 架构: 四层解耦 — core/ (纯TS) → infrastructure/ → features/ → ui/ → app/

## 已完成

### 🛡️ 安全加固五阶段（2026-05-18~19）

**Phase 1 — 基础设施**
- [x] Pydantic BaseSettings 重写 config.py（JWT_SECRET_KEY 无默认值，不设则启动失败）
- [x] .env.example 文档化 + .gitignore 扩展至 42 行（覆盖日志/测试/构建产物/环境文件）

**Phase 2 — Cookie 认证体系**
- [x] JWT 存储从 localStorage 迁移至 httpOnly cookie（SameSite=Lax, Secure in production）
- [x] 后端 get_current_user 同时支持 Header Bearer 和 Cookie
- [x] POST /auth/logout 清除 cookie
- [x] 前端 http-client 移除手动 Authorization 头，统一 credentials: "include"
- [x] auth-store 移除 token 字段，只 persist user 对象
- [x] AuthGuard 改为检查 user 而非 token

**Phase 3 — 速率限制 + 安全头**
- [x] slowapi 全局限流器（200/day, 50/hour），自定义 _get_client_ip（优先 X-Forwarded-For）
- [x] /register: 5/hour, /login: 10/minute, AI审稿: 20/day;5/hour, 管理端点: 30/minute
- [x] 安全头中间件：X-Content-Type-Options, X-Frame-Options, HSTS, CSP, Referrer-Policy, Permissions-Policy
- [x] TrustedHostMiddleware

**Phase 4 — 输入校验 + 错误脱敏 + 账户锁定**
- [x] Pydantic field_validator：密码强度(8位+大写+数字)、邮箱自动小写、充值金额范围、model_id 正则
- [x] 全局异常处理器（500/502 返回通用消息，不泄露内部细节）
- [x] AI 审稿错误脱敏（ValueError → logger + 通用500，httpx.TimeoutException 处理）
- [x] AI 审稿积分竞态修复（FOR UPDATE 锁在 AI 调用前获取，失败回滚）
- [x] 账户锁定机制：5次失败 → 锁定15分钟，登录成功重置

**Phase 5 — 生产加固**
- [x] 请求日志中间件（Request ID、method、path、status、耗时、IP）
- [x] AuditLog 模型 + 所有管理 CUD 操作记录（操作人、时间、IP、变更内容）
- [x] Vite 生产构建加固（sourcemap 仅开发模式）

**🛡️ 2FA 双因素认证**
- [x] User 模型新增 token_version、totp_secret、totp_enabled 字段
- [x] JWT 令牌版本控制（token_version 递增即全局登出）
- [x] pyotp TOTP 生成/验证（setup/enable/disable/verify-2fa）
- [x] 登录流程：密码通过 → 若开启2FA返回 pre_auth_token → verify_2fa 换取真 JWT
- [x] pre_auth_token 5分钟有效，不可用于 API 访问（get_current_user 拒绝 pre_auth tokens）
- [x] POST /admin/revoke-tokens：管理员可撤销任意用户 token

### 🤖 AI 模型后台管理（2026-05-19）

**后端**
- [x] 模型公开/管理双 Schema（AiModelPublicOut 仅 id/name/provider，Admin 含 model_id/定价）
- [x] 6 个端点：公开列表 + 管理 CRUD + 启停切换
- [x] 删除保护：有审稿记录引用的模型不可删除（409）
- [x] 更新保护：explicit whitelist 防 Mass Assignment（仅允许 5 个字段）
- [x] 所有管理端点双重守卫：JWT + _require_admin()
- [x] ReviewRequest.model_name (string) → model_id (int)，前端只持有整数 ID

**前端**
- [x] AdminGuard 路由组件（检查 user.role !== 'admin' → 重定向）
- [x] AiModelsAdminPage — 完整 CRUD 管理页（表格/创建/编辑/Dialog删除/启停切换/Skeleton 加载态）
- [x] 6 个 React Query hooks（含乐观更新 + 错误回滚）
- [x] Sidebar/AppLayout 动态显示"后台管理"菜单（仅 admin 可见）
- [x] ReviewNewPage 模型选择从硬编码改为 useAiModels() hook（Skeleton 加载态）
- [x] 删除 core/domain/constants.ts 中的 AI_MODELS 硬编码常量

### 后端（FastAPI，端口 8765）
- [x] 数据库 schema + SQLAlchemy ORM（10 张表，含 AiModel + AuditLog）
- [x] Auth API — 注册/登录/JWT + 2FA + Token 版本控制
- [x] Novels API — 作品 CRUD
- [x] Chapters API — 章节上传（.txt /.md）+ 鉴权+所有权校验
- [x] Reviews API — AI 七维审稿（含积分扣减）+ 鉴权+所有权校验
- [x] Credits API — 余额查询/充值/流水（FOR UPDATE 防并发）
- [x] 全 API 鉴权覆盖 + 所有权校验
- [x] 积分余额计算统一 (balance_after 替代 SUM)
- [x] 审稿扣积分 FOR UPDATE 防并发超扣
- [x] 章节上传 chapter_index 并发冲突处理 (409)

### 前端（React，端口 5173）
- [x] core/ — API 类型定义、Zod 校验、业务常量与工具函数
- [x] infrastructure/ — HTTP client (credentials:"include"+全局错误Toast)、Zustand stores (auth/ui/toast)、API 实现
- [x] ui/layout/ — AppLayout + AuthGuard + AdminGuard + ToastContainer + ErrorBoundary
- [x] app/ — 路由（lazy loading + AuthGuard/AdminGuard 双层守卫）
- [x] features/auth/ — 登录/注册页
- [x] features/novels/ — 作品列表/创建/详情页
- [x] features/reviews/ — 发起审稿/审稿列表/审稿详情
- [x] features/credits/ — 积分余额/充值/交易流水
- [x] features/profile/ — 个人中心页
- [x] features/ai-models/ — AI 模型后台管理页（admin only）
- [x] 全局路由守卫 + 错误处理
- [x] TypeScript 编译通过，生产构建通过
- [x] Vite proxy: /api/* → localhost:8765
- [x] UI 组件库扩充：7 → 17 个 shadcn/ui 组件
- [x] 全局 Loading → Skeleton 替换（5 个页面）
- [x] 原生表单元素 → shadcn 组件替换（select/textarea/label，9 个页面）
- [x] window.confirm() → Dialog 替换（所有删除操作）
- [x] 移动端响应式：汉堡菜单 + Sheet 导航
- [x] 触屏适配：章节操作菜单 @media (hover) 适配
- [x] 积分中心 Tab 切换与侧边栏/URL 同步修复
- [x] 全局设计系统升级："纸墨书香"方向（2026-05-17）
  - 品牌色：紫 → 陶土/赭石 (#c46b3c, #a8592b)
  - 背景：冷灰 → 暖象牙宣纸色 + SVG 纸纤维纹理
  - 侧边栏：冷墨蓝 → 温墨色
  - 标题字体：宋体优先（Noto Serif SC / STSong / Songti SC）
  - 正文/UI：系统中文字体（PingFang SC / Microsoft YaHei）
  - 所有 shadcn OKLCH 变量迁移至暖色调
  - 按钮质感升级：渐变填充 + 多层阴影 + 内高光 + 按压反馈
  - 卡片/输入框/徽章：内阴影深度感 + 多层边框
- [x] Claude Code 安装 frontend-design Skill（Anthropic 官方）
- [x] NovelDetailPage 两列布局：左「简介说明」(编辑+文件导入.md/.txt) + 右「上传章节」，同高度居中 (2026-05-18)
- [x] 简介说明支持 Textarea 编辑保存 + 从 .md/.txt 文件读取导入

## 待完成
1. 管理员 2FA 前端页面（setup/enable/disable UI）— 后端已实现，前端缺失导致开启2FA后无法登录
2. 联调测试
3. 会员体系
4. PostgreSQL 迁移

## 运行状态（2026-05-19）

**启动命令**
```bash
# 后端 (端口 8765)
cd backend && python -m uvicorn app.main:app --reload --port 8765

# 前端 (端口 5173)
cd frontend && npm run dev
```

**管理员入口**
- 地址：http://localhost:5173/login
- 管理员账号：`zhaojf@storypulse.dev` / `Admin1234`
- 登录后侧边栏自动显示「后台管理」→「模型管理」（仅 admin 角色可见）
- 直接访问 `/admin/ai-models` 会被 AdminGuard 拦截（非 admin 重定向至 /novels）

**已知问题**
- ⚠️ 管理员账号 2FA 已临时关闭（`totp_enabled=0`），因为前端 2FA 验证页面尚未实现
- 若误开启 2FA 导致无法登录，后端执行：`User.totp_enabled = 0; User.totp_secret = None`
- 前端实际端口为 5173（Vite 默认），非早期记录的 5175

---

## 第二阶段：小说素材采集 + 分类 Skill 提炼（2026-05-17 启动）

### 数据来源
- **番茄小说**（主源）：通过 FanqieNovelDownloader 开源工具 + SVIP 账号下载
- **Project Gutenberg**（辅助源）：公版中文经典，fetch MCP 下载

### 分阶段策略

**Phase A — 下载素材 (SVIP 有效期7天，截至约 2026-05-24)**
- 每本选 TXT + 合并模式，多线程下载
- 覆盖 6 个类别，共 19 本头部作品：
  1. **悬疑/怪谈**（5本）: 十日终焉、诡舍、异兽迷城、莫犯太岁、捞尸人
  2. **玄幻/修仙**（4本）: 遮天、仙逆、大力丸修仙、天渊
  3. **都市/高武**（2本）: 我在精神病院学斩神、我不是戏神
  4. **科幻/末世**（2本）: 诸神愚戏、时停起手
  5. **历史**（2本）: 冒姓琅琊、科举农家子的权臣之路
  6. **女频**（3本）: 游戏入侵、癫都癫癫点好啊、一剑问九霄
- 已有公版素材：鲁迅全集8部、红楼梦/儒林外史/聊斋志异/警世通言/老残游记样本

**Phase B — 提炼分类审稿 Skill**
- 从每类小说中提取该类别的**写作特征和评分标准**
- 写成 system prompt，作为审稿 API 的 skill 参数
- 不需要微调模型，直接用于现有 StoryPulse 审稿流程
- 推荐审稿后端模型优先级：Claude Sonnet/Opus > DeepSeek > Qwen > GPT-4o
- 分析方式：DeepSeek 网页版上传 TXT，3轮对话（创作→润色→审稿），再综合提炼
- Skill 存储位置：`xiangm_tudou/skills/{分类}/{单本或综合版}/`

**Phase C — RAG 增强（可选后续）**
- 小说文本向量化存入 Chroma/Qdrant
- 审稿时检索同类参考段落，辅助模型分析
- 技术栈：LangChain + embedding model

### Phase A 下载进度（2026-05-17）

| 类别 | 已完成 | 待下载 |
|------|--------|--------|
| 悬疑 | 十日终焉(全文)、诡舍(全文)、异兽迷城(全文) | 莫犯太岁、捞尸人 |
| 修仙 | — | 遮天、仙逆、大力丸修仙、天渊 |
| 都市 | 斩神(试读)、戏神(试读) | 需SVIP重下 |
| 科幻 | — | 诸神愚戏、时停起手 |
| 历史 | 冒姓琅琊(全文) | 科举农家子的权臣之路 |
| 女频 | — | 游戏入侵、癫都癫癫点好啊、一剑问九霄 |

### Phase B Skill 提炼进度

**悬疑类 ✅ 已完成**

单本分析（存于 `xiangm_tudou/skills/悬疑类/`）：

| 作品 | 创作 Skill | 润色 Skill | 审稿 Skill |
|------|-----------|-----------|-----------|
| 十日终焉 | ✓ | ✓ | ✓ |
| 诡舍 | ✓ | ✓ | ✓ |
| 异兽迷城 | ✓ | ✓ | ✓ |

综合版（存于 `xiangm_tudou/skills/悬疑类/综合版/`）：
- 创作_Skill.md — 7大章，融合三本精华，含战斗设计章节
- 润色_Skill.md — 4大章，功能检验+潜台词三层法则+节奏量化+P0-P3优先级
- 七维审稿_Skill.md — 7维度+审稿检查项+快速对照卡+S/A/B/C/D评级

**下一目标：修仙类** — 待下载后跑DeepSeek分析

### 已有本地素材（fetch/ 目录）
- 鲁迅_呐喊.txt / 彷徨.txt / 朝花夕拾.txt / 狂人日记.txt / 野草.txt / 阿Q正传.txt / 南腔北调集.txt / 中国小说史略.txt
- 红楼梦_样本.txt / 儒林外史_样本.txt / 聊斋志异_样本.txt / 警世通言_样本.txt / 老残游记_样本.txt
- Crime_and_Punishment_Ch1.txt

### Skill输出目录
所有Skill文件存放在 `xiangm_tudou/skills/`，按分类和单本/综合组织。
