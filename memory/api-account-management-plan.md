---
name: api-account-management-plan
description: API 账号管理 & 多平台智能路由 — 待开发模块，支持火山引擎/硅基流动/Kimi/智谱多平台 Key 管理和按模型最优平台路由
metadata:
  type: project
---

# API 账号管理 & 多平台路由 — 待开发模块

**状态：方案已完成，待开发**

## 背景

当前 `ai_models` 表仅有 `provider` 字段记录平台名称，但各平台的 API Key 未持久化存储（硬编码在代码或 .env 中），不支持多平台账号切换和同模型跨平台 fallback。

前期调研确定了**一主两备**策略：

| 模型 | 🥇 最优平台 | 输入价格(¥/M) | 输出价格(¥/M) | 速度 | 稳定性 |
|------|-----------|-------------|-------------|------|--------|
| DeepSeek-V3/R1 | **火山引擎** | 2 | 8 | 30 t/s | 99.5% |
| Qwen3-235B/Max | **硅基流动** | 0.65 | 4.35 | 中 | 中 |
| Kimi K2 | **Kimi 官方** | 4 | 16 | 100 t/s | 高 |
| GLM-Z1 | **智谱官方** | 0.5 | — | 200 t/s | 高 |

## 数据库变更

### 新建表：`api_providers`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| name | TEXT UNIQUE | volcano / siliconflow / moonshot / zhipu |
| display_name | TEXT | 中文名（火山引擎/硅基流动/月之暗面/智谱AI） |
| base_url | TEXT | API 地址 |
| api_key | TEXT | 加密存储的 API Key |
| is_active | INTEGER | 是否启用 |
| created_at / updated_at | TEXT | 时间戳 |

### 修改表：`ai_models`

新增字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| provider_id | INTEGER FK → api_providers.id | 替代原有 provider 字符串 |
| priority | INTEGER DEFAULT 0 | 同 model_id 跨平台时的优先级（越小越优先） |
| is_fallback | INTEGER DEFAULT 0 | 是否仅为备用（主平台故障时启用） |

> 原有 `provider` 字段保留作兼容过渡，后续迁移至 `provider_id`。

## 后端变更

### 新增文件

| 文件 | 说明 |
|------|------|
| `backend/app/models/api_provider.py` | ApiProvider ORM 模型 |
| `backend/app/modules/api_providers.py` | API 账号 CRUD 路由 |
| `backend/app/modules/model_router.py` | 模型路由引擎（根据 model_id + 策略选最优平台） |

### 修改文件

| 文件 | 变更 |
|------|------|
| `backend/app/models/__init__.py` | 注册 ApiProvider |
| `backend/app/models/billing.py` | AiModel 新增 provider_id / priority / is_fallback |
| `backend/app/schemas.py` | 新增 ApiProviderCreate/Update/Out，AiModel 扩展 |
| `backend/app/main.py` | 注册 api_providers_router |
| `database/init.sql` | 新增 api_providers 表 + ai_models 字段变更 |

### API 端点 (`/admin/api-providers`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/api-providers` | 列表（脱敏显示 Key 后4位） |
| POST | `/admin/api-providers` | 创建（加密存储 API Key） |
| GET | `/admin/api-providers/{id}` | 详情 |
| PATCH | `/admin/api-providers/{id}` | 更新 Key / 启停 |
| DELETE | `/admin/api-providers/{id}` | 删除（检查关联模型引用） |
| POST | `/admin/api-providers/{id}/test` | 连通性测试 |

### 模型路由逻辑

```python
def resolve_provider(model_id, strategy="priority"):
    """
    1. 查询 ai_models WHERE model_id = ? AND is_active = 1
    2. 按 priority ASC 排序
    3. 排除 is_fallback = 1 的（除非主平台全部不可用）
    4. 返回最优 ApiProvider（含 base_url + api_key）
    """
```

## 前端变更

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/core/api/api-providers.ts` | IApiProviderApi 接口 |
| `src/infrastructure/api/api-providers-api.ts` | API 实现 |
| `src/features/api-providers/hooks.ts` | React Query hooks |
| `src/features/api-providers/pages/ApiProvidersAdminPage.tsx` | 管理页面 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `src/core/api/types.ts` | 新增 ApiProvider 类型定义 |
| `src/core/api/endpoints.ts` | 新增 API_PROVIDERS 端点 |
| `src/app/router.tsx` | 注册 `/admin/api-providers` 路由 |
| `src/ui/layout/AppLayout.tsx` | 侧栏新增"API 账号管理"入口 |
| `src/features/ai-models/pages/AiModelsAdminPage.tsx` | 表单新增 provider_id + priority |

### 管理页面功能

- 表格展示所有平台（名称/API地址/Key脱敏/状态/关联模型数）
- 新增/编辑 Dialog（含连通性测试按钮）
- 删除确认（警告：删除后关联模型将不可用）
- 顶部说明卡片展示各模型最优平台对照表

## 预置配置（首次初始化）

| 平台 | 预置模型 |
|------|---------|
| 火山引擎 | DeepSeek-V3.2, DeepSeek-R1 |
| 硅基流动 | Qwen3-235B, Qwen-Max, Qwen3-32B |
| Kimi 官方 | Kimi K2 Turbo, Kimi K2 Thinking |
| 智谱官方 | GLM-Z1-Air, GLM-4-FlashX（免费） |

## 密钥安全

- API Key 使用 `passlib` AES256 对称加密存储
- 前端脱敏显示：`sk-****xxxx`（仅显示后4位）
- 传输全程 HTTPS + 仅 Admin 可访问
