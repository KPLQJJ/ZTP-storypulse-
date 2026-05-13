---
name: storypulse-project
description: StoryPulse — AI驱动的网文创作审稿平台，开发中
metadata: 
  node_type: memory
  type: project
  originSessionId: da9e6025-3248-4962-b357-4a5d4c7a162c
---

# StoryPulse — AI 网文创作审稿平台（开发中）

## 项目定位
AI 驱动的网文创作审稿平台，核心差异化功能为七维诊断审稿系统，辅助 AI 写作与创作。

## 团队
- 赵景锋 — 开发（后端 + 数据库）
- 钟振华 — 产品 & 审稿 Prompt（测试优化七维审查 skill）
- 潘智 — 运营推广

## 技术栈
- Backend: Python + FastAPI + SQLAlchemy
- Frontend: React (Vite + TypeScript)
- Database: SQLite (dev) → PostgreSQL (production)

## 数据库设计（8 张表，已完成 ORM）
| 表 | 说明 |
|---|---|
| users | 用户（writer/reviewer/admin） |
| membership_plans | 会员套餐（free/pro/premium）|
| user_memberships | 用户当前会员 |
| novels | 作品 |
| chapters | 章节（含 source/file_path/format 等扩展字段）|
| ai_models | AI 模型积分定价 |
| reviews | 七维审稿报告 |
| credit_transactions | 积分流水 |

## 七维审稿维度
1. 整体判断与市场定位
2. 开篇钩子与黄金三章诊断
3. 文笔与AI味道检测
4. 节奏与爽点投放诊断
5. 人物塑造与关系张力诊断
6. 金手指与世界观诊断
7. 追读钩子与章节留扣诊断

## 积分体系
- 充值 RMB → 平台积分（比例待定，倾向于积分值大一些）
- 不同 AI 模型消耗不同积分/千 tokens
- 积分流水含 balance_after 可审计

## 上传功能
- MVP 优先支持 .md 和 .txt 文件上传，后续再加 .docx
- 审稿以作品为单位，用户可自选该作品的若干章节

## 已完成
- 2026-05-14: 数据库 schema（init.sql + seed.sql）
- 2026-05-14: SQLAlchemy ORM 模型（8 张表全覆盖）
- 2026-05-14: FastAPI 后端骨架（config + database + main.py）
- 2026-05-14: Git 协作流程搭建 — CLAUDE.md + memory/ 入仓，双人 Git 同步机制就绪

## 协作方式
- 两人通过 GitHub（dev 分支）协作，均使用 Claude CLI
- 项目记忆存放在 `memory/` 目录，随 Git 同步
- 标准循环：`git pull` → Claude 开发 → `git add memory/ && git commit && git push`
- CLAUDE.md 位于项目根目录，两端 Claude 共享规则

## 待开发（按优先级）
1. 文件上传接口（.txt / .md 解析）
2. AI 审稿接口（调钟振华的 skill）
3. 登录系统
4. 充值系统
5. 前端页面
6. 双向同步 + 会员云存储
7. usage_logs 表（MVP 后加）
