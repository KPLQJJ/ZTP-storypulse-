-- StoryPulse Database Schema
-- SQLite (development) / PostgreSQL (production)
--
-- Run: sqlite3 storypulse.db < database/init.sql

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT    NOT NULL UNIQUE,
    email           TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL,
    avatar_url      TEXT,
    role            TEXT    NOT NULL DEFAULT 'writer'
                            CHECK (role IN ('writer', 'reviewer', 'admin')),
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- 2. membership_plans — 会员套餐定义
-- ============================================================
CREATE TABLE IF NOT EXISTS membership_plans (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT    NOT NULL UNIQUE
                            CHECK (name IN ('free', 'pro', 'premium')),
    price_rmb           REAL    NOT NULL DEFAULT 0,
    credits_per_month   INTEGER NOT NULL DEFAULT 0,
    storage_limit_bytes INTEGER NOT NULL DEFAULT 0,
    features            TEXT    NOT NULL DEFAULT '{}',    -- JSON: 功能权限清单
    is_active           INTEGER NOT NULL DEFAULT 1,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 3. user_memberships — 用户当前会员
-- ============================================================
CREATE TABLE IF NOT EXISTS user_memberships (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id         INTEGER NOT NULL REFERENCES membership_plans(id),
    start_date      TEXT    NOT NULL,
    end_date        TEXT,
    status          TEXT    NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_user_memberships_user_id ON user_memberships(user_id);

-- ============================================================
-- 4. novels
-- ============================================================
CREATE TABLE IF NOT EXISTS novels (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT    NOT NULL,
    genre           TEXT    NOT NULL,
    description     TEXT,
    status          TEXT    NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'ongoing', 'completed')),
    word_count      INTEGER NOT NULL DEFAULT 0,
    cover_url       TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_novels_user_id ON novels(user_id);
CREATE INDEX idx_novels_genre   ON novels(genre);
CREATE INDEX idx_novels_status  ON novels(status);

-- ============================================================
-- 5. chapters
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id        INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    chapter_index   INTEGER NOT NULL,
    title           TEXT    NOT NULL,
    content         TEXT    NOT NULL,
    word_count      INTEGER NOT NULL DEFAULT 0,
    status          TEXT    NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'published')),
    source          TEXT    NOT NULL DEFAULT 'manual'
                            CHECK (source IN ('manual', 'upload', 'ai_generated')),
    file_path       TEXT,             -- 本地文件路径（AI创作/双向同步）
    file_format     TEXT,             -- txt / md / docx
    content_hash    TEXT,             -- SHA256，用于双向同步冲突检测
    synced_at       TEXT,             -- 最后一次与本地文件同步的时间
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(novel_id, chapter_index)
);

CREATE INDEX idx_chapters_novel_id  ON chapters(novel_id);
CREATE INDEX idx_chapters_source    ON chapters(source);

-- ============================================================
-- 6. ai_models — AI 模型定价表
--
-- 定义上游各模型每千 tokens 消耗的平台积分。
-- 审稿时按实际调用的模型 + tokens 量扣费。
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_models (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT    NOT NULL UNIQUE,
    provider            TEXT    NOT NULL,
    model_id            TEXT    NOT NULL,       -- 传给 API 的实际模型 ID
    credits_per_1k_input   REAL NOT NULL DEFAULT 0,
    credits_per_1k_output  REAL NOT NULL DEFAULT 0,
    is_active           INTEGER NOT NULL DEFAULT 1,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 7. reviews
--
-- "七维诊断审稿系统"
-- 以作品为单位，用户自选该作品的若干章节进行审稿。
-- 七个维度的评分与评语存为 JSON 格式，方便扩展和修改维度定义。
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id        INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    chapter_ids     TEXT    NOT NULL DEFAULT '[]',   -- JSON: [1, 3, 5]
    overall_score   REAL    NOT NULL CHECK(overall_score >= 0 AND overall_score <= 10),
    dimensions      TEXT    NOT NULL DEFAULT '[]',    -- JSON: 七维评分详情
    model_used      TEXT,                             -- 审稿调用的模型（关联 ai_models.name）
    tokens_input    INTEGER,
    tokens_output   INTEGER,
    credits_cost    REAL,                             -- 这次审稿消耗的平台积分
    summary         TEXT,
    suggestions     TEXT,
    reviewer_type   TEXT    NOT NULL DEFAULT 'auto_ai'
                            CHECK (reviewer_type IN ('auto_ai', 'manual')),
    status          TEXT    NOT NULL DEFAULT 'completed'
                            CHECK (status IN ('pending', 'completed')),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_reviews_novel_id   ON reviews(novel_id);
CREATE INDEX idx_reviews_overall    ON reviews(overall_score);
CREATE INDEX idx_reviews_status     ON reviews(status);

-- dimensions JSON 格式示例：
-- [
--   {"label":"整体判断与市场定位",          "score":8.5, "comment":"...", "suggestions":"..."},
--   {"label":"开篇钩子与黄金三章诊断",      "score":7.0, "comment":"...", "suggestions":"..."},
--   {"label":"文笔与AI味道检测",           "score":6.5, "comment":"...", "suggestions":"..."},
--   {"label":"节奏与爽点投放诊断",          "score":8.0, "comment":"...", "suggestions":"..."},
--   {"label":"人物塑造与关系张力诊断",      "score":7.5, "comment":"...", "suggestions":"..."},
--   {"label":"金手指与世界观诊断",          "score":9.0, "comment":"...", "suggestions":"..."},
--   {"label":"追读钩子与章节留扣诊断",      "score":7.0, "comment":"...", "suggestions":"..."}
-- ]

-- ============================================================
-- 8. credit_transactions — 积分流水
--
-- 用户当前余额 = SUM 该用户所有 amount。
-- 历史数据可审计，不可修改（避免财务纠纷）。
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount          REAL    NOT NULL,     -- 正 = 充值/赠送，负 = 消耗
    balance_after   REAL    NOT NULL,     -- 交易后余额，方便快速查询
    type            TEXT    NOT NULL
                        CHECK (type IN ('recharge', 'spend', 'bonus', 'refund')),
    reference_type  TEXT,                 -- 关联业务: 'review' / 'membership' / 'recharge'
    reference_id    INTEGER,              -- 关联业务 ID
    description     TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_credit_transactions_user_id   ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type      ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created   ON credit_transactions(created_at);
