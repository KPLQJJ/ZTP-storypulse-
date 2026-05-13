# StoryPulse — 项目开发指南

## 技术栈
- Backend: Python + FastAPI + SQLAlchemy (ORM)
- Frontend: React (Vite + TypeScript)
- Database: SQLite (dev) → PostgreSQL (production)

## 数据库
- `database/init.sql` — 完整 schema（开发/生产共用）
- `database/seed.sql` — 测试种子数据
- 开发时：`sqlite3 storypulse.db < database/init.sql && sqlite3 storypulse.db < database/seed.sql`
- 生产时：通过 init.sql 手动管理，ORM 只做 CRUD

## 记忆系统（重要）
所有项目记忆、开发进度、决策记录存放在 `memory/` 目录：

- `memory/MEMORY.md` — 索引，每次先读这个了解项目状态
- `memory/*.md` — 各分类记忆

**团队协作流程：**
1. 开始工作前：`git pull` 拉取最新记忆
2. 工作过程中：Claude 会自动读写 `memory/` 下的文件
3. 完成工作后：`git add memory/ && git commit -m "update memory" && git push`

两人都遵守这个流程，记忆就能保持同步。

## 启动方式
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8765
```
