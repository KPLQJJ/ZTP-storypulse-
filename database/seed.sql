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
INSERT INTO novels (id, user_id, title, genre, description, status, word_count, tags, source_type) VALUES
    (1, 4, '苍穹之刃',     '玄幻', '少年林尘意外获得上古神兵，从此踏上逆天修行之路。',            'ongoing',   150000, '["热血","逆袭","系统流"]', 'manual'),
    (2, 4, '都市超级高手', '都市', '退伍兵王回归都市，保护妹妹，吊打各路宵小。',                  'ongoing',   200000, '["都市","兵王","爽文"]', 'manual'),
    (3, 5, '星穹纪元',     '科幻', '公元3024年，人类已在银河系建立联邦，一场未知危机悄然降临。', 'draft',      30000,  '["科幻","星际","硬核"]', 'manual');

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
-- API Providers
-- ============================================================
-- NOTE: api_key values are Fernet-encrypted placeholders for dev.
-- In production, use POST /admin/api-providers to set real keys.
INSERT INTO api_providers (id, name, display_name, base_url, api_key, is_active) VALUES
    (1, 'volcano',      '火山引擎',    'https://ark.cn-beijing.volces.com/api/v3',   'REPLACE_WITH_ENCRYPTED_KEY', 1),
    (2, 'aliyun_bailian','阿里云百炼',  'https://dashscope.aliyuncs.com/compatible-mode/v1', 'REPLACE_WITH_ENCRYPTED_KEY', 1),
    (3, 'siliconflow',   '硅基流动',    'https://api.siliconflow.cn',                  'REPLACE_WITH_ENCRYPTED_KEY', 1),
    (4, 'zhipu',         '智谱AI',      'https://open.bigmodel.cn/api/paas/v4',       'REPLACE_WITH_ENCRYPTED_KEY', 1),
    (5, 'moonshot',      'Kimi官方',    'https://api.moonshot.cn',                     'REPLACE_WITH_ENCRYPTED_KEY', 1),
    (6, 'deepseek',      'DeepSeek官方', 'https://api.deepseek.com',                   'REPLACE_WITH_ENCRYPTED_KEY', 1);

-- ============================================================
-- AI Models Pricing (多平台多态矩阵)
-- ============================================================
-- Columns: name, provider, model_id, provider_id, priority, is_fallback, capability_tags, credits_per_1k_input, credits_per_1k_output

-- 🆓 免费层
INSERT INTO ai_models (name, provider, model_id, provider_id, priority, is_fallback, capability_tags, credits_per_1k_input, credits_per_1k_output) VALUES
    ('GLM-4-FlashX',   '智谱',      'glm-4-flashx',   4, 1, 0, '["fast","free"]',                0,   0),
    ('Qwen3-8B',        '硅基流动',  'qwen3-8b',       3, 1, 0, '["fast","free","cn_native"]',     0,   0);

-- 💰 低价层 (输入 < ¥2/M)
INSERT INTO ai_models (name, provider, model_id, provider_id, priority, is_fallback, capability_tags, credits_per_1k_input, credits_per_1k_output) VALUES
    ('DeepSeek-V4 Flash', '火山引擎',    'deepseek-v4-flash', 1, 1, 0, '["fast","value","long_context"]', 1,   2),
    ('DeepSeek-V4 Flash', 'DeepSeek官方','deepseek-v4-flash', 6, 2, 1, '["fast","value","long_context"]', 1,   2),
    ('GLM-Z1-Air',        '智谱',        'glm-z1-air',        4, 1, 0, '["fast","logic","ultra_fast"]',      0.5, 0.5);

-- 💰💰 标准层 (¥2-10/M 输入)
INSERT INTO ai_models (name, provider, model_id, provider_id, priority, is_fallback, capability_tags, credits_per_1k_input, credits_per_1k_output) VALUES
    ('Qwen3-235B',    '阿里云百炼',  'qwen3-235b',  2, 1, 0, '["cn_native","creative","long_context"]',  2.5,  10),
    ('Qwen3-235B',    '硅基流动',    'qwen3-235b',  3, 2, 1, '["cn_native","creative","long_context"]',  0.65, 4.3),
    ('Qwen-Max',      '阿里云百炼',  'qwen-max',    2, 1, 0, '["cn_native","creative","premium"]',       5,    20),
    ('Kimi K2 Thinking','Kimi官方',  'kimi-k2-thinking', 5, 1, 0, '["creative","logic","cn_native"]',   4,    16),
    ('DeepSeek-V4 Pro','火山引擎',   'deepseek-v4-pro',  1, 1, 0, '["premium","long_context","agent"]', 12,   24);

-- 💰💰💰 高端层 (> ¥10/M)
INSERT INTO ai_models (name, provider, model_id, provider_id, priority, is_fallback, capability_tags, credits_per_1k_input, credits_per_1k_output) VALUES
    ('Kimi K2 Turbo', 'Kimi官方',   'kimi-k2-turbo', 5, 1, 0, '["fast","premium","cn_native"]',         16,   64);

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

-- ============================================================
-- Novel Groups (v2)
-- ============================================================
INSERT INTO novel_groups (id, user_id, name, sort_order) VALUES
    (1, 4, '科幻系列', 0),
    (2, 4, '玄幻系列', 1),
    (3, 5, '未分组',   0);

-- ============================================================
-- Outlines — 苍穹之刃 大纲树 (v2)
-- ============================================================
INSERT INTO outlines (id, novel_id, parent_id, title, content, sort_order) VALUES
    (1, 1, NULL, '第一卷：崛起之始', '林尘从废柴到宗门新星的成长历程', 0),
    (2, 1, 1,    '第1章：捡到古剑', '后山奇遇，获得上古神兵', 0),
    (3, 1, 1,    '第2章：宗门大比', '初露锋芒，一战成名', 1),
    (4, 1, NULL, '第二卷：风云际会', '走出宗门，天下格局初现', 1),
    (5, 1, 4,    '入世修行', '下山后的第一个考验', 0);

-- ============================================================
-- Characters — 苍穹之刃 角色卡 (v2)
-- ============================================================
INSERT INTO characters (id, novel_id, name, description, attributes) VALUES
    (1, 1, '林尘',   '主角，出身平凡但天赋异禀，性格坚毅不服输',    '{"gender":"男","age":17,"role":"主角","cultivation":"练气九层"}'),
    (2, 1, '赵无极', '宗门大师兄，初期看不起林尘，后成为劲敌',     '{"gender":"男","age":22,"role":"反派/对手","cultivation":"筑基中期"}'),
    (3, 1, '慕容雪', '宗门第一美女，暗中帮助林尘的神秘女子',        '{"gender":"女","age":18,"role":"女主","cultivation":"筑基初期"}');

-- ============================================================
-- Worldbuilding — 苍穹之刃 世界观 (v2)
-- ============================================================
INSERT INTO worldbuilding (id, novel_id, category, title, content) VALUES
    (1, 1, '力量体系',  '修炼境界',   '练气→筑基→金丹→元婴→化神→合体→大乘→渡劫，共八境'),
    (2, 1, '地理',      '青云宗',     '位于东荒苍茫山脉，方圆三千里，宗门弟子三千余人'),
    (3, 1, '社会组织',  '五大宗门',   '青云宗、无极宗、天剑宗、万妖谷、魔渊殿，维持大陆势力平衡');

-- ============================================================
-- Agent Configs — 苍穹之刃 Agent 模型配置 (v2)
-- ============================================================
INSERT INTO agent_configs (novel_id, agent_role, model_id) VALUES
    (1, 'outline_writer',     1),   -- GLM-4-FlashX (免费)
    (1, 'chapter_writer',     3),   -- DeepSeek-V4 Flash (低价)
    (1, 'world_builder',      10);  -- DeepSeek-V4 Pro (标准)

-- ============================================================
-- Agent Sessions & Messages (v2)
-- ============================================================
INSERT INTO agent_sessions (id, novel_id, user_id, context_type, context_id, title) VALUES
    (1, 1, 4, 'outline', 1, '大纲规划 — 第一卷讨论');

INSERT INTO agent_messages (session_id, role, agent_name, content, tokens, metadata) VALUES
    (1, 'user',    NULL,              '帮我规划玄幻小说第一卷的大纲，主角需要经历几次关键战斗', NULL, '{}'),
    (1, 'assistant', 'outline_writer', '好的！以下是第一卷大纲建议：\n\n1. 意外获得金手指（第1-3章）\n2. 初次战斗，击败欺辱自己的外门弟子（第4-6章）\n3. 宗门大比，越级挑战筑基期师兄（第7-10章）\n...', 450, '{"model":"glm-4-flashx","duration_ms":3200}');
