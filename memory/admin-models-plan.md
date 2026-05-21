---
name: admin-models-plan
description: AI 模型后台管理模块 — ✅ 已完成开发（2026-05-19），6端点+AdminGuard+审计日志+双Schema隔离
metadata:
  type: project
---

# 模型后台管理 — 实现方案

## Context

StoryPulse 项目已有 `ai_models` 表（3条种子数据）和 `AiModel` ORM 模型，但缺少后台管理界面。前端 `AI_MODELS` 硬编码在 `constants.ts`，只有1个模型，审稿页模型选择无法反映实际可用模型。本次新增完整的 AI 模型后台 CRUD 管理 + 前端动态模型列表。

---

## 设计原则（强制）

### 原则 1: API 路径零硬编码

所有前后端 API 路径集中管理，禁止在业务代码中直接写字符串路径：

- **前端**: 新增 `frontend/src/core/api/endpoints.ts`，所有 API 路径集中为常量对象。各 API 实现文件从 endpoints 导入，不再散落硬编码字符串

```typescript
// frontend/src/core/api/endpoints.ts
export const ENDPOINTS = {
  AI_MODELS: {
    LIST: '/ai-models',
    ADMIN_LIST: '/admin/ai-models',
    ADMIN_DETAIL: (id: number) => `/admin/ai-models/${id}`,
    ADMIN_TOGGLE: (id: number) => `/admin/ai-models/${id}/toggle`,
  },
}
```

### 原则 2: 用户端不泄露关键资产

`ai_models` 表包含两类信息：

| 字段 | 敏感度 | 说明 |
|------|--------|------|
| id, name, provider | 低 | 展示用，普通用户可见 |
| model_id, pricing | **高** | 内部 API 标识符 + 成本结构，仅管理员可见 |

措施：

1. **公开接口瘦身**: `GET /ai-models`（无认证）只返回 `id`、`name`、`provider`，不返回 `model_id` 和定价
2. **管理接口完整**: `GET /admin/ai-models` 返回全部字段，前端 AdminGuard 保护页面
3. **审稿请求改用整数 ID**: `ReviewRequest.model_name: str` → `ReviewRequest.model_id: int`，前端只持有整数 ID，后端通过 ID 反查 `model_id` 字符串

---

## 实施步骤

### Step 1: 后端 — Pydantic Schemas

**文件:** `backend/app/schemas.py`（追加到文件末尾）

新增5个 schema：

| Schema | 用途 | 字段 |
|--------|------|------|
| `AiModelPublicOut` | 公开接口（审稿页下拉） | id, name, provider — **不含 model_id 和定价** |
| `AiModelAdminOut` | 管理接口（后台页） | 全部字段: id, name, provider, model_id, credits_per_1k_input, credits_per_1k_output, is_active, created_at |
| `AiModelCreate` | 新建模型 | name(必填), provider(必填), model_id(必填), credits_per_1k_input(默认0), credits_per_1k_output(默认0) |
| `AiModelUpdate` | 编辑模型 | 全部可选: name, provider, model_id, credits_per_1k_input, credits_per_1k_output |
| `AiModelToggle` | 启停切换 | is_active: bool |

遵循现有 `model_config = {"from_attributes": True}` 模式。**两个 Out schema 是关键：公开接口绝不返回 model_id 和定价。**

---

### Step 2: 后端 — Admin AI Models Router

**新文件:** `backend/app/modules/ai_models.py`

6个端点（复用 `_require_admin` 助手的模式，参考 `credits.py:117`）：

| 方法 | 路径 | 权限 | 说明 | 返回 Schema |
|------|------|------|------|-------------|
| GET | `/ai-models` | 公开 | 返回 is_active=1 的模型（审稿页下拉用） | `AiModelPublicOut[]` |
| GET | `/admin/ai-models` | admin | 返回全部模型（含停用，含定价） | `AiModelAdminOut[]` |
| POST | `/admin/ai-models` | admin | 新建模型，处理重名 IntegrityError → 409 | `AiModelAdminOut` |
| PATCH | `/admin/ai-models/{ai_model_id}` | admin | 部分更新，`model_dump(exclude_unset=True)` | `AiModelAdminOut` |
| PATCH | `/admin/ai-models/{ai_model_id}/toggle` | admin | 切换 is_active（bool → int 转换） | `AiModelAdminOut` |
| DELETE | `/admin/ai-models/{ai_model_id}` | admin | 删除模型，返回 204 | — |

路径参数名用 `ai_model_id` 避免与 AiModel 的 `model_id` 列名混淆。

**关键安全措施**: `GET /ai-models` 为公开端点，只返回 `AiModelPublicOut`（id, name, provider）。`model_id`（内部 API 标识符）和定价信息仅在 admin 端点返回。

---

### Step 3: 后端 — 注册路由

**文件:** `backend/app/main.py`

- 新增 import: `from app.modules.ai_models import router as ai_models_router`
- 新增: `app.include_router(ai_models_router)`

---

### Step 4: 前端 — 类型定义 + API 端点常量

**文件:** `frontend/src/core/api/types.ts`（追加到文件末尾）

新增接口，与后端 Schema 对齐：

```typescript
// 公开接口 — 不含 model_id 和定价
export interface AiModelPublicOut {
  id: number
  name: string
  provider: string
}

// 管理接口 — 完整字段
export interface AiModelAdminOut extends AiModelPublicOut {
  model_id: string
  credits_per_1k_input: number
  credits_per_1k_output: number
  is_active: number
  created_at: string
}

export interface AiModelCreate {
  name: string
  provider: string
  model_id: string
  credits_per_1k_input?: number
  credits_per_1k_output?: number
}

export interface AiModelUpdate {
  name?: string
  provider?: string
  model_id?: string
  credits_per_1k_input?: number
  credits_per_1k_output?: number
}
```

**新文件:** `frontend/src/core/api/endpoints.ts` — API 路径集中管理

```typescript
export const ENDPOINTS = {
  AI_MODELS: {
    LIST: '/ai-models',
    ADMIN_LIST: '/admin/ai-models',
    ADMIN_CREATE: '/admin/ai-models',
    ADMIN_UPDATE: (id: number) => `/admin/ai-models/${id}`,
    ADMIN_TOGGLE: (id: number) => `/admin/ai-models/${id}/toggle`,
    ADMIN_DELETE: (id: number) => `/admin/ai-models/${id}`,
  },
}
```

后续所有 API 实现文件从 `ENDPOINTS` 导入，禁止硬编码路径字符串。

---

### Step 5: 前端 — API 接口

**新文件:** `frontend/src/core/api/ai-models.ts`

```typescript
import type { AiModelPublicOut, AiModelAdminOut, AiModelCreate, AiModelUpdate } from './types'

export interface IAiModelApi {
  list(): Promise<AiModelPublicOut[]>         // 公开：仅 id/name/provider
  listAll(): Promise<AiModelAdminOut[]>        // 管理：完整字段
  create(req: AiModelCreate): Promise<AiModelAdminOut>
  update(id: number, req: AiModelUpdate): Promise<AiModelAdminOut>
  toggle(id: number, isActive: boolean): Promise<AiModelAdminOut>
  delete(id: number): Promise<void>
}
```

遵循 `credits.ts:ICreditApi` 模式。公开方法返回 `AiModelPublicOut`，管理方法返回 `AiModelAdminOut`。

---

### Step 6: 前端 — API 实现

**新文件:** `frontend/src/infrastructure/api/ai-models-api.ts`

使用 `http` 客户端 + `ENDPOINTS.AI_MODELS` 集中管理的路径常量。禁止在方法中硬编码 URL 字符串。

```typescript
import { http } from '@/infrastructure/http-client'
import { ENDPOINTS } from '@/core/api/endpoints'
import type { IAiModelApi } from '@/core/api/ai-models'
import type { AiModelPublicOut, AiModelAdminOut, AiModelCreate, AiModelUpdate } from '@/core/api/types'

export const aiModelsApi: IAiModelApi = {
  list: () => http.get<AiModelPublicOut[]>(ENDPOINTS.AI_MODELS.LIST),
  listAll: () => http.get<AiModelAdminOut[]>(ENDPOINTS.AI_MODELS.ADMIN_LIST),
  create: (req) => http.post<AiModelAdminOut>(ENDPOINTS.AI_MODELS.ADMIN_CREATE, req),
  update: (id, req) => http.patch<AiModelAdminOut>(ENDPOINTS.AI_MODELS.ADMIN_UPDATE(id), req),
  toggle: (id, isActive) => http.patch<AiModelAdminOut>(ENDPOINTS.AI_MODELS.ADMIN_TOGGLE(id), { is_active: isActive }),
  delete: (id) => http.delete(ENDPOINTS.AI_MODELS.ADMIN_DELETE(id)),
}
```

---

### Step 7: 前端 — React Query Hooks

**新文件:** `frontend/src/features/ai-models/hooks.ts`

6个 hooks：`useAiModels`, `useAdminAiModels`, `useCreateAiModel`, `useUpdateAiModel`, `useToggleAiModel`, `useDeleteAiModel`。遵循 `features/credits/hooks.ts` 模式（useQuery/useMutation + 缓存失效 + toast）。

---

### Step 8: 前端 — 管理页面

**新文件:** `frontend/src/features/ai-models/pages/AiModelsAdminPage.tsx`

- **表格**: 列 = 名称、供应商、模型ID、输入价格、输出价格、状态（Badge）、操作
- **创建/编辑 Dialog**: 复用同一 Dialog，`editingModel` 状态控制模式
- **删除确认**: 二次确认 Dialog
- **启用/停用**: 按钮调用 toggle mutation
- 使用现有 shadcn/ui 组件 (Button, Dialog, Input, Label, Card, Select, Badge)

---

### Step 9: 前端 — AdminGuard 组件

**新文件:** `frontend/src/ui/layout/AdminGuard.tsx`

- 从 `useAuthStore` 读取 `user`
- `user.role !== 'admin'` 时重定向到 `/novels`
- 否则渲染 `<Outlet />`
- 完全遵循 `AuthGuard.tsx` 模式

---

### Step 10: 前端 — 路由更新

**文件:** `frontend/src/app/router.tsx`

```tsx
// 新增 lazy import
const AiModelsAdminPage = lazy(() => import('@/features/ai-models/pages/AiModelsAdminPage'))

// 在 AuthGuard 内部新增 admin 路由组
<Route element={<AdminGuard />}>
  <Route element={<AppLayout />}>
    <Route path="/admin/ai-models" element={<AiModelsAdminPage />} />
  </Route>
</Route>
```

AdminGuard 嵌套在 AuthGuard 内部 = 先检查登录，再检查角色。

---

### Step 11: 前端 — 侧边栏更新

**文件:** `frontend/src/ui/layout/Sidebar.tsx`

- 新增 `Cpu` 图标导入
- `menuSections` 改为动态计算：`user.role === 'admin'` 时追加"后台管理" section
- 追加活跃状态检测逻辑（`/admin/ai-models` 路径匹配）

---

### Step 12: 前端 — 审稿页动态模型列表 + ReviewRequest 改造

**文件:** `frontend/src/features/reviews/pages/ReviewNewPage.tsx`

- 移除 `import { AI_MODELS } from '@/core/domain/constants'`
- 新增 `import { useAiModels } from '@/features/ai-models/hooks'`
- 用 `useAiModels()` 返回的 `AiModelPublicOut[]` 替换所有硬编码 `AI_MODELS` 引用
- 数据加载后默认选中第一个模型
- 下拉显示 `{m.name} ({m.provider})`，值为 `m.id`（整数）
- **模型引用改为整数 ID**: `modelName` 状态变量改为 `selectedModelId: number`

**文件:** `frontend/src/core/domain/constants.ts`
- 删除 `AI_MODELS` 常量（确认无其他引用后）

**文件:** `frontend/src/core/api/types.ts`
- `ReviewRequest` 接口改造：`model_name: string` → `model_id: number`

**文件:** `backend/app/schemas.py`
- `ReviewRequest.model_name: str` → `ReviewRequest.model_id: int`
- 原有默认值 `"deepseek-v4-pro"` 改为 `0`（表示未选择，后端校验）

**文件:** `backend/app/modules/reviews.py`（review 服务）
- 从 `request.model_id`（整数）反查 `ai_models` 表获取实际 `model_id` 字符串
- 找不到模型时返回 400

> **安全目的**: 前端只持有模型的整数 ID，内部 API 字符串 `model_id`（如 `deepseek-v4-flash`）和定价信息从未暴露到用户端。

---

### Step 13: 种子数据

无需修改 — 现有 `database/seed.sql` 已有3个模型种子数据。

---

## 依赖顺序

```
Step 1 → 2 → 3（后端，可先行）
Step 4 (types + endpoints) → 5 (interface) → 6 (impl, 使用 endpoints) → 7 (hooks)
Step 7 完成后:
  ├── Step 8（管理页面）
  ├── Step 9 → 10（路由 + AdminGuard）
  ├── Step 11（侧边栏）
  └── Step 12（审稿页改造 + ReviewRequest model_name → model_id）
```

后端 Steps 1-3 与前端 Steps 4-7 可并行开发。

---

## 验证清单

1. **后端 API**：用 admin token 测试全部 6 个端点；用非 admin token 验证返回 403
2. **管理员 UI**：zhaojf@storypulse.dev 登录 → 侧边栏出现"后台管理" → 进入 `/admin/ai-models` → 新建/编辑/启停/删除模型
3. **非管理员隔离**：普通用户登录 → 无"后台管理"菜单 → 手动访问 `/admin/ai-models` 被重定向
4. **审稿页联动**：新建的活跃模型出现在 `/reviews/new` 模型下拉中；停用的模型不出现在下拉中
5. **安全 — 资产不泄露**：
   - `GET /api/ai-models` 响应体中**不含** `model_id`、`credits_per_1k_input`、`credits_per_1k_output` 字段
   - 普通用户浏览器 Network 面板看不到模型内部标识符和定价
6. **安全 — 路径不硬编码**：全局搜索 `'/ai-models'`、`'/admin/ai-models'` 只出现在 `endpoints.ts`，业务代码全部通过 `ENDPOINTS.AI_MODELS.*` 引用
