---
name: memory-location
description: "记忆日志默认写入项目目录 memory/ 而非系统自动记忆目录"
type: feedback
---

# 记忆日志存放位置

**规则：** 所有记忆日志（MEMORY.md 及各个记忆文件）读写默认在项目目录下的 `memory/` 文件夹。

**Why:** 用户明确要求将记忆文件迁移到 `D:\One drive\OneDrive\Desktop\claude code\xiangm_tudou\memory\`，方便项目相关记忆与代码一起管理。

**How to apply:** 每次需要更新/创建记忆时，优先操作 `xiangm_tudou/memory/` 下的文件。不要写入系统默认的自动记忆目录（`C:\Users\ZhuanZ...\.claude\projects\...\memory\`）。
