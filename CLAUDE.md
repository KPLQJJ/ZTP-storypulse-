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

**团队协作流程（Feature 分支 + PR）：**
1. 开始工作前：`git checkout dev && git pull`
2. 开 feature 分支：`git checkout -b feature-xxx`
3. 在 feature 分支上开发（Claude 自动读写 memory/）
4. 完成开发后：
   ```bash
   git add memory/ && git commit -m "feat: xxx"
   git push -u origin feature-xxx
   ```
5. 去 GitHub 提 Pull Request → review → 合并到 dev
6. 合并后 `git checkout dev && git pull` 即可同步对方的改动

两人各自在自己的 feature 分支上工作，互不干扰。
关掉 PR 即可废弃，合并后 dev 同时包含两人的工作。

## 启动方式
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8765
```
