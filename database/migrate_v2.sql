-- StoryPulse v2.0 Migration Script
-- Migrates an existing storypulse.db from v1 to v2 schema.
-- Run: sqlite3 storypulse.db < database/migrate_v2.sql
--
-- WARNING: Backup your database before running this script!

-- ============================================================
-- 1. novel_groups
-- ============================================================
CREATE TABLE IF NOT EXISTS novel_groups (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT    NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_novel_groups_user_id ON novel_groups(user_id);

-- ============================================================
-- 2. ALTER novels — add v2 columns
-- ============================================================
ALTER TABLE novels ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE novels ADD COLUMN group_id INTEGER REFERENCES novel_groups(id);
ALTER TABLE novels ADD COLUMN source_type TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE novels ADD COLUMN file_path TEXT;

-- ============================================================
-- 3. ALTER polishes — relax polish_style constraint
-- In SQLite, we must recreate the table to change constraints.
-- ============================================================
CREATE TABLE polishes_v2 (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id          INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    chapter_ids       TEXT    NOT NULL DEFAULT '[]',
    polish_style      TEXT,                 -- v2: nullable, no CHECK
    input_word_count  INTEGER NOT NULL DEFAULT 0,
    output_word_count INTEGER NOT NULL DEFAULT 0,
    polish_results    TEXT    NOT NULL DEFAULT '[]',
    genre_skill_path  TEXT,
    style_skill_path  TEXT,
    model_used        TEXT,
    tokens_input      INTEGER,
    tokens_output     INTEGER,
    credits_cost      REAL,
    status            TEXT    NOT NULL DEFAULT 'completed',
    created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO polishes_v2 SELECT * FROM polishes;
DROP TABLE polishes;
ALTER TABLE polishes_v2 RENAME TO polishes;

CREATE INDEX IF NOT EXISTS idx_polishes_novel_id ON polishes(novel_id);
CREATE INDEX IF NOT EXISTS idx_polishes_status   ON polishes(status);

-- ============================================================
-- 4. outlines
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

CREATE INDEX IF NOT EXISTS idx_outlines_novel_id  ON outlines(novel_id);
CREATE INDEX IF NOT EXISTS idx_outlines_parent_id ON outlines(parent_id);

-- ============================================================
-- 5. characters
-- ============================================================
CREATE TABLE IF NOT EXISTS characters (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id        INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    name            TEXT    NOT NULL,
    description     TEXT    NOT NULL DEFAULT '',
    attributes      TEXT    NOT NULL DEFAULT '{}',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_characters_novel_id ON characters(novel_id);

-- ============================================================
-- 6. worldbuilding
-- ============================================================
CREATE TABLE IF NOT EXISTS worldbuilding (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id        INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    category        TEXT    NOT NULL,
    title           TEXT    NOT NULL,
    content         TEXT    NOT NULL DEFAULT '',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_worldbuilding_novel_id ON worldbuilding(novel_id);
CREATE INDEX IF NOT EXISTS idx_worldbuilding_category ON worldbuilding(category);

-- ============================================================
-- 7. agent_configs
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_configs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id        INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    agent_role      TEXT    NOT NULL,
    model_id        INTEGER NOT NULL REFERENCES ai_models(id),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(novel_id, agent_role)
);

CREATE INDEX IF NOT EXISTS idx_agent_configs_novel_id ON agent_configs(novel_id);

-- ============================================================
-- 8. agent_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id        INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context_type    TEXT,
    context_id      INTEGER,
    title           TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_novel_id ON agent_sessions(novel_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id  ON agent_sessions(user_id);

-- ============================================================
-- 9. agent_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      INTEGER NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
    role            TEXT    NOT NULL,
    agent_name      TEXT,
    content         TEXT    NOT NULL,
    tokens          INTEGER,
    metadata        TEXT    NOT NULL DEFAULT '{}',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_session_id ON agent_messages(session_id);

-- Migration complete
