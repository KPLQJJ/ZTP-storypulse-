-- StoryPulse seed data for development/testing
--
-- 1. 先建表
-- 2. 再跑本文件插入测试数据
-- sqlite3 storypulse.db < database/seed.sql

-- ============================================================
-- Users
-- ============================================================
INSERT INTO users (username, email, password_hash, role) VALUES
    ('赵景锋',     'zhaojf@storypulse.dev',  'hash_placeholder_1', 'admin'),
    ('钟振华',     'zhongzh@storypulse.dev', 'hash_placeholder_2', 'reviewer'),
    ('潘智',       'panz@storypulse.dev',    'hash_placeholder_3', 'writer'),
    ('作者小明',   'xiaoming@example.com',   'hash_placeholder_4', 'writer'),
    ('作者小红',   'xiaohong@example.com',   'hash_placeholder_5', 'writer');

-- ============================================================
-- Membership Plans
-- ============================================================
INSERT INTO membership_plans (id, name, price_rmb, credits_per_month, storage_limit_bytes, features) VALUES
    (1, 'free',     0,     0,   104857600,    '{"multi_format": false, "ai_creation": false, "max_novels": 3}'),
    (2, 'pro',      19.90, 500, 536870912,    '{"multi_format": true,  "ai_creation": false, "max_novels": 20}'),
    (3, 'premium',  49.90, 2000, 2147483648,  '{"multi_format": true,  "ai_creation": true,  "max_novels": -1}');

-- ============================================================
-- User Memberships
-- ============================================================
INSERT INTO user_memberships (user_id, plan_id, start_date, end_date, status) VALUES
    (1, 3, '2026-01-01', '2027-01-01', 'active'),  -- 赵景锋 → premium
    (2, 1, '2026-01-01', NULL,          'active'),  -- 钟振华 → free
    (3, 1, '2026-01-01', NULL,          'active'),  -- 潘智   → free
    (4, 1, '2026-01-01', NULL,          'active'),  -- 小明   → free
    (5, 1, '2026-01-01', NULL,          'active');  -- 小红   → free

-- ============================================================
-- Novels
-- ============================================================
INSERT INTO novels (id, user_id, title, genre, description, status, word_count) VALUES
    (1, 4, '苍穹之刃',     '玄幻', '少年林尘意外获得上古神兵，从此踏上逆天修行之路。',            'ongoing',   150000),
    (2, 4, '都市超级高手', '都市', '退伍兵王回归都市，保护妹妹，吊打各路宵小。',                  'ongoing',   200000),
    (3, 5, '星穹纪元',     '科幻', '公元3024年，人类已在银河系建立联邦，一场未知危机悄然降临。', 'draft',      30000);

-- ============================================================
-- Chapters (each novel has at least 3 chapters for review)
-- ============================================================
INSERT INTO chapters (id, novel_id, chapter_index, title, content, word_count, status, source, file_format) VALUES
    -- 苍穹之刃 前三章
    (1, 1, 1, '捡到一把剑',      '林尘做梦也没想到，自己在后山捡到的这把锈迹斑斑的铁剑，竟会彻底改变他的人生。', 3500, 'published', 'manual', 'txt'),
    (2, 1, 2, '宗门大比',        '演武场上人山人海，三年一度的宗门大比即将开始。', 4200, 'published', 'manual', 'txt'),
    (3, 1, 3, '一剑破天',        '"就凭你？"赵无极冷笑一声，手中长枪直刺而来。林尘握紧剑柄，眼中寒光一闪。', 4800, 'published', 'manual', 'txt'),
    -- 都市超级高手 前三章
    (4, 2, 1, '退伍归来',        '五年了。李明站在火车站前，看着这座熟悉又陌生的城市，深吸一口气。', 3000, 'published', 'manual', 'txt'),
    (5, 2, 2, '妹妹的麻烦',      '教室门口围了一群人。李明拨开人群，看见妹妹被几个染着黄毛的小混混堵在墙角。', 3800, 'published', 'manual', 'txt'),
    (6, 2, 3, '一拳',            '"哥——"妹妹的声音还没落下，李明已经动了。没有人看清他的动作，只听"砰"的一声。', 4100, 'published', 'manual', 'txt'),
    -- 星穹纪元 前三章
    (7, 3, 1, '边境信号',        '"长官！边缘星域检测到异常信号！"值班员的声音在通讯频道里响起。', 5000, 'published', 'manual', 'txt'),
    (8, 3, 2, '未知生命',        '探测器的画面上，一个巨大的黑色物体正在缓慢移动。那不是人类建造的任何东西。', 5500, 'published', 'manual', 'txt'),
    (9, 3, 3, '舰队集结',        '联邦议会在紧急召开三小时后，做出了一个艰难的决定。', 4800, 'published', 'manual', 'txt');

-- ============================================================
-- AI Models Pricing
-- ============================================================
INSERT INTO ai_models (name, provider, model_id, credits_per_1k_input, credits_per_1k_output) VALUES
    ('deepseek-v4-flash',  'DeepSeek',   'deepseek-v4-flash',   0.5,  1.0),
    ('claude-sonnet-4-6',  'Anthropic',  'claude-sonnet-4-6',   2.0,  6.0),
    ('claude-opus-4-7',    'Anthropic',  'claude-opus-4-7',    10.0, 30.0);

-- ============================================================
-- Reviews
-- ============================================================
INSERT INTO reviews (novel_id, chapter_ids, overall_score, dimensions, model_used, tokens_input, tokens_output, credits_cost, summary, suggestions, reviewer_type) VALUES
    (1, '[1, 2, 3]', 7.5,
        '[
            {"label":"整体判断与市场定位",           "score":8.0, "comment":"玄幻题材热度高，开局够爽"},
            {"label":"开篇钩子与黄金三章诊断",       "score":7.0, "comment":"第一章稍慢热，第二章开始进入节奏"},
            {"label":"文笔与AI味道检测",             "score":7.5, "comment":"文笔流畅，偶有模板化表达"},
            {"label":"节奏与爽点投放诊断",           "score":8.0, "comment":"爽点分布合理，打脸桥段到位"},
            {"label":"人物塑造与关系张力诊断",       "score":7.0, "comment":"主角刻画尚可，配角偏扁平"},
            {"label":"金手指与世界观诊断",           "score":8.5, "comment":"古剑设定有记忆点，世界格局交代清楚"},
            {"label":"追读钩子与章节留扣诊断",       "score":7.0, "comment":"第三章结尾留扣不够狠，追读欲望一般"}
        ]',
        'deepseek-v4-flash', 12500, 1800, 8.05,
        '整体来看是一部合格的玄幻爽文，开篇节奏和人物塑造有提升空间。',
        '建议强化第一章的钩子，前三章主角的动机需要更清晰。',
        'auto_ai');

-- ============================================================
-- Credit Transactions
-- ============================================================
INSERT INTO credit_transactions (user_id, amount, balance_after, type, reference_type, reference_id, description) VALUES
    (1,  100,  100,  'recharge', NULL, NULL, '新用户注册赠送'),
    (4,  200,  200,  'recharge', NULL, NULL, '新用户注册赠送'),
    (5,  200,  200,  'recharge', NULL, NULL, '新用户注册赠送'),
    (4, -8.05, 191.95, 'spend', 'review', 1, '苍穹之刃审稿消耗');
