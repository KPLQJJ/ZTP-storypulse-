import json
import os
import httpx

SEVEN_DIMENSIONS = [
    ("整体判断与市场定位", "评估作品的题材热度、目标读者匹配度、市场竞争力和整体商业潜力"),
    ("开篇钩子与黄金三章诊断", "诊断开篇是否具备足够的吸引力，前三章是否建立起核心悬念和读者期待"),
    ("文笔与AI味道检测", "评估文笔流畅度、语言风格，检测是否有明显的AI生成痕迹（模板化表达、机械感等）"),
    ("节奏与爽点投放诊断", "评估情节节奏是否合理，爽点/爆点的投放频率和力度是否到位"),
    ("人物塑造与关系张力诊断", "评估主角及配角的立体感、成长弧线、人物关系张力"),
    ("金手指与世界观诊断", "评估设定的独特性和自洽性，世界观构建是否扎实"),
    ("追读钩子与章节留扣诊断", "评估章节结尾的悬念设置能力和读者追读欲望的持续性"),
]

REVIEW_SYSTEM_PROMPT = """你是一位资深网文编辑，擅长对网络小说进行专业审稿。
你需要对给定的章节内容进行七维诊断分析，输出严格 JSON 格式的结果。

评分标准（1-10分）：
- 1-3分：严重不足，需要大幅修改
- 4-6分：基本合格，有提升空间
- 7-8分：表现不错，具备一定竞争力
- 9-10分：非常出色，接近或达到精品水准

输出格式：
{
  "overall_score": 7.5,
  "dimensions": [
    {"label": "整体判断与市场定位", "score": 8.0, "comment": "具体分析...", "suggestions": "改进建议..."},
    {"label": "开篇钩子与黄金三章诊断", "score": 7.0, "comment": "具体分析...", "suggestions": "改进建议..."},
    {"label": "文笔与AI味道检测", "score": 7.5, "comment": "具体分析...", "suggestions": "改进建议..."},
    {"label": "节奏与爽点投放诊断", "score": 8.0, "comment": "具体分析...", "suggestions": "改进建议..."},
    {"label": "人物塑造与关系张力诊断", "score": 7.0, "comment": "具体分析...", "suggestions": "改进建议..."},
    {"label": "金手指与世界观诊断", "score": 8.5, "comment": "具体分析...", "suggestions": "改进建议..."},
    {"label": "追读钩子与章节留扣诊断", "score": 7.0, "comment": "具体分析...", "suggestions": "改进建议..."}
  ],
  "summary": "对作品的总体评价（100-200字）",
  "suggestions": "针对性的修改建议（100-200字）"
}

要求：
1. 每个维度的 comment 至少 30 字，给出具体的文本依据
2. suggestions 要给出可操作的修改方向
3. 评分要有区分度，不要全部集中在 7-8 分
4. overall_score 是七个维度分数的加权平均，不是简单平均"""


def build_review_prompt(chapters: list[dict]) -> str:
    """把章节内容拼成审稿 prompt"""
    parts = []
    for ch in chapters:
        parts.append(
            f"## 第{ch['chapter_index']}章 {ch['title']}\n\n{ch['content']}"
        )
    text = "\n\n".join(parts)
    total_words = sum(ch["word_count"] for ch in chapters)
    return f"以下是待审稿作品的{len(chapters)}个章节（总计约{total_words}字），请进行七维诊断分析：\n\n{text}"


async def call_ai_review(
    chapters: list[dict],
    model_id: str = "deepseek-v4-pro",
    api_key: str | None = None,
    base_url: str | None = None,
) -> dict:
    """调用 AI API 进行审稿，返回解析后的结果"""
    api_key = api_key or os.getenv("DEEPSEEK_API_KEY", "")
    base_url = base_url or os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

    if not api_key:
        raise ValueError("缺少 API Key，请设置 DEEPSEEK_API_KEY 环境变量")

    user_prompt = build_review_prompt(chapters)

    async with httpx.AsyncClient(timeout=httpx.Timeout(300)) as client:
        resp = await client.post(
            f"{base_url}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model_id,
                "messages": [
                    {"role": "system", "content": REVIEW_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.6,
                "response_format": {"type": "json_object"},
            },
        )

        if resp.status_code != 200:
            raise RuntimeError(f"AI API 错误 ({resp.status_code}): {resp.text}")

        data = resp.json()

    content = data["choices"][0]["message"]["content"]
    tokens_in = data["usage"]["prompt_tokens"]
    tokens_out = data["usage"]["completion_tokens"]

    result = json.loads(content)

    # 校验维度完整性
    expected_labels = [d[0] for d in SEVEN_DIMENSIONS]
    actual_labels = [d["label"] for d in result.get("dimensions", [])]
    if actual_labels != expected_labels:
        # 尝试修正顺序
        if set(actual_labels) == set(expected_labels):
            result["dimensions"].sort(
                key=lambda d: expected_labels.index(d["label"])
                if d["label"] in expected_labels
                else 999
            )

    return {
        "result": result,
        "tokens_input": tokens_in,
        "tokens_output": tokens_out,
    }
