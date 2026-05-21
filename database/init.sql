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
-- 4. novel_groups — 作品分组
-- ============================================================
CREATE TABLE IF NOT EXISTS novel_groups (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT    NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_novel_groups_user_id ON novel_groups(user_id);

-- ============================================================
-- 5. novels
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
    tags            TEXT    NOT NULL DEFAULT '[]',        -- JSON: 网文标签 ["热血","穿越","系统流"]
    group_id        INTEGER REFERENCES novel_groups(id),
    source_type     TEXT    NOT NULL DEFAULT 'manual'
                            CHECK (source_type IN ('from_scratch', 'import', 'manual')),
    file_path       TEXT,             -- 半成品上传路径（Path B 导入）
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_novels_user_id ON novels(user_id);
CREATE INDEX idx_novels_genre   ON novels(genre);
CREATE INDEX idx_novels_status  ON novels(status);

-- ============================================================
-- 6. chapters
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
-- 7. api_providers — API 平台账号管理
-- ============================================================
CREATE TABLE IF NOT EXISTS api_providers (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT    NOT NULL UNIQUE,
    display_name        TEXT    NOT NULL,
    base_url            TEXT    NOT NULL,
    api_key             TEXT    NOT NULL,        -- AES256 加密存储
    is_active           INTEGER NOT NULL DEFAULT 1,
    health_status       TEXT    NOT NULL DEFAULT 'unknown',
    last_health_check   TEXT,
    consecutive_failures INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 8. ai_models — AI 模型定价表
--
-- 定义上游各模型每千 tokens 消耗的平台积分。
-- 审稿时按实际调用的模型 + tokens 量扣费。
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_models (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT    NOT NULL UNIQUE,
    provider            TEXT    NOT NULL,
    model_id            TEXT    NOT NULL,       -- 传给 API 的实际模型 ID
    provider_id         INTEGER REFERENCES api_providers(id),
    priority            INTEGER NOT NULL DEFAULT 0,    -- 同 model_id 跨平台优先级（越小越优先）
    is_fallback         INTEGER NOT NULL DEFAULT 0,    -- 是否备用
    capability_tags     TEXT    NOT NULL DEFAULT '[]',  -- JSON: ["creative_writing","logic","long_context"]
    credits_per_1k_input   REAL NOT NULL DEFAULT 0,
    credits_per_1k_output  REAL NOT NULL DEFAULT 0,
    is_active           INTEGER NOT NULL DEFAULT 1,
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 9. user_model_preferences — 用户模型偏好（全局/按作品）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_model_preferences (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_type  TEXT    NOT NULL
                              CHECK (application_type IN ('review', 'polish', 'writing')),
    model_id          INTEGER NOT NULL REFERENCES ai_models(id),
    novel_id          INTEGER REFERENCES novels(id) ON DELETE CASCADE,
    created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, application_type, novel_id)
);

CREATE INDEX IF NOT EXISTS idx_prefs_user_app ON user_model_preferences(user_id, application_type);

-- ============================================================
-- 10. reviews
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
    genre_skill_path TEXT,                             -- 本次使用的品类审稿 Skill 路径
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
-- 11. polishes — AI 润色记录
--
-- polish_results JSON 格式示例：
-- [
--   {"chapter_index":1, "title":"第1章", "original_text":"...", "polished_text":"...", "changes_summary":"优化了..."},
--   ...
-- ]
-- ============================================================
CREATE TABLE IF NOT EXISTS polishes (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id          INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    chapter_ids       TEXT    NOT NULL DEFAULT '[]',
    polish_style      TEXT,                 -- v2: 可空，后期用 Skill 配置替代固定风格
    input_word_count  INTEGER NOT NULL DEFAULT 0,
    output_word_count INTEGER NOT NULL DEFAULT 0,
    polish_results    TEXT    NOT NULL DEFAULT '[]',
    genre_skill_path  TEXT,                 -- 使用的品类 Skill 文件路径
    style_skill_path  TEXT,                 -- 使用的风格 Skill 文件路径
    model_used        TEXT,
    tokens_input      INTEGER,
    tokens_output     INTEGER,
    credits_cost      REAL,
    status            TEXT    NOT NULL DEFAULT 'completed'
                              CHECK (status IN ('pending', 'completed', 'failed')),
    created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_polishes_novel_id ON polishes(novel_id);
CREATE INDEX idx_polishes_status   ON polishes(status);

-- ============================================================
-- 12. credit_transactions — 积分流水
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

-- ============================================================
-- 13. audit_logs — 管理员操作审计日志
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER REFERENCES users(id),
    action          TEXT    NOT NULL,
    target_type     TEXT,
    target_id       INTEGER,
    detail          TEXT,
    ip_address      TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX idx_audit_logs_created    ON audit_logs(created_at);

-- ============================================================
-- 14. outlines — 大纲树（自引用）
-- ============================================================
CREATE TABLE IF NOT EXISTS outlines (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id        INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    parent_id       INTEGER REFERENCES outlines(id) ON DELETE SET NULL,
    title           TEXT    NOT NULL,
    content         TEXT    NOT NULL DEFAULT '',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_outlines_novel_id  ON outlines(novel_id);
CREATE INDEX idx_outlines_parent_id ON outlines(parent_id);

-- ============================================================
-- 15. characters — 角色卡
-- ============================================================
CREATE TABLE IF NOT EXISTS characters (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id        INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    name            TEXT    NOT NULL,
    description     TEXT    NOT NULL DEFAULT '',
    attributes      TEXT    NOT NULL DEFAULT '{}',     -- JSON: {"gender":"男","age":25,"role":"主角",...}
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_characters_novel_id ON characters(novel_id);

-- ============================================================
-- 16. worldbuilding — 世界观条目
-- ============================================================
CREATE TABLE IF NOT EXISTS worldbuilding (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id        INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    category        TEXT    NOT NULL,        -- 力量体系/地理/历史/社会组织/其他
    title           TEXT    NOT NULL,
    content         TEXT    NOT NULL DEFAULT '',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_worldbuilding_novel_id ON worldbuilding(novel_id);
CREATE INDEX idx_worldbuilding_category ON worldbuilding(category);

-- ============================================================
-- 17. agent_configs — Agent 模型配置（per novel）
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_configs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id        INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    agent_role      TEXT    NOT NULL
                            CHECK (agent_role IN (
                                'outline_writer', 'chapter_writer', 'world_builder',
                                'character_designer', 'polisher', 'reviewer'
                            )),
    model_id        INTEGER NOT NULL REFERENCES ai_models(id),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(novel_id, agent_role)
);

CREATE INDEX idx_agent_configs_novel_id ON agent_configs(novel_id);

-- ============================================================
-- 18. agent_sessions — Agent 对话会话
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id        INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context_type    TEXT,                -- 'chapter' / 'outline' / 'character' / 'worldbuilding' / NULL
    context_id      INTEGER,             -- 对应实体的 ID
    title           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_agent_sessions_novel_id ON agent_sessions(novel_id);
CREATE INDEX idx_agent_sessions_user_id  ON agent_sessions(user_id);

-- ============================================================
-- 19. agent_messages — 会话消息
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      INTEGER NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    role            TEXT    NOT NULL
                            CHECK (role IN ('user', 'assistant', 'system')),
    agent_name      TEXT,                -- 对应的 Agent 角色名（assistant 消息时填充）
    content         TEXT    NOT NULL,
    tokens          INTEGER,             -- token 消耗
    metadata        TEXT    NOT NULL DEFAULT '{}',   -- JSON: {"model":"...","duration_ms":123}
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_agent_messages_session_id ON agent_messages(session_id);
