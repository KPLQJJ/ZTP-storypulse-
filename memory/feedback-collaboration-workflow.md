---
name: feedback-collaboration-workflow
description: Feature 分支 + PR 工作流由 Claude 全程执行，包括 git 操作和记忆同步
metadata:
  type: feedback
---

Feature 分支 + PR 协作工作流由 Claude 全程执行每一步。

**Why:** 用户要求协作开发的每一步（开分支、commit、push、提 PR、合并）都由 Claude 完成，不需要手动操作。

**How to apply:**
1. 每次开发新功能前，先 `git checkout dev && git pull` 同步最新
2. 开 feature 分支 `git checkout -b feature-xxx`
3. 开发完成后自动 commit + push + 提醒提 PR
4. 确保 memory/ 目录更新并及时 push，让另一端设备能 `git pull` 同步到最新记忆
5. 涉及 git push 等网络操作时提醒用户确保网络已配置

相关项目记忆：[[storypulse-project]]
