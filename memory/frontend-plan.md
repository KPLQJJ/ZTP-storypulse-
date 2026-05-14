---
name: frontend-plan
description: StoryPulse 前端技术选型与开发计划（待讨论）
metadata:
  type: project
---

# StoryPulse 前端开发计划

## 技术选型（已确定）
| 类别 | 选择 | 理由 |
|---|---|---|
| UI 组件 | shadcn/ui | 源码复制到项目、零依赖锁定、Tailwind 原生、现代审美 |
| 路由 | React Router v7 声明式模式 | SPA 标准方案，布局路由 + 懒加载 |
| 服务端状态 | TanStack Query v5 | 自动缓存/重取/分页，覆盖 80% 状态 |
| 客户端状态 | Zustand | 1KB，只管 auth token + UI 偏好 |
| 表单验证 | React Hook Form + Zod | 行业标配，与 shadcn Form 无缝集成 |
| 构建 | Vite + TypeScript | 已定，保持 |

## 待讨论：UI 设计（头脑风暴阶段）
- 具体页面布局、配色方案
- 七维诊断的可视化形式（雷达图 vs 条形图 vs 其他）
- 移动端适配策略

## 页面清单（全功能 MVP）
1. LoginPage — 登录
2. RegisterPage — 注册
3. DashboardPage — 首页仪表盘
4. NovelListPage — 作品列表
5. NovelCreatePage — 创建作品
6. NovelDetailPage — 作品详情（章节列表 + 审稿历史）
7. ReviewNewPage — 发起审稿（选章节 + 选模型）
8. ReviewDetailPage — 七维诊断结果
9. CreditsPage — 积分管理（余额 + 充值 + 流水）
10. ProfilePage — 个人中心

## 待后端补充
- Novel CRUD 接口（开发中）
