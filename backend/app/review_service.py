import asyncio
import hashlib
import json
import logging
import time
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.modules.http_client_pool import get_client
from app.modules.model_router import resolve_provider, NoProviderAvailableError
from app.modules.circuit_breaker import circuit_breaker

logger = logging.getLogger(__name__)

SEVEN_DIMENSIONS = [
    ("整体判断与市场定位", "评估作品的题材热度、目标读者匹配度、市场竞争力和整体商业潜力"),
    ("开篇钩子与黄金三章诊断", "诊断开篇是否具备足够的吸引力，前三章是否建立起核心悬念和读者期待"),
    ("文笔与AI味道检测", "评估文笔流畅度、语言风格，检测是否有明显的AI生成痕迹（模板化表达、机械感等）"),
    ("节奏与爽点投放诊断", "评估情节节奏是否合理，爽点/爆点的投放频率和力度是否到位"),
    ("人物塑造与关系张力诊断", "评估主角及配角的立体感、成长弧线、人物关系张力"),
    ("金手指与世界观诊断", "评估设定的独特性和自洽性，世界观构建是否扎实"),
    ("追读钩子与章节留扣诊断", "评估章节结尾的悬念设置能力和读者追读欲望的持续性"),
]

OUTPUT_FORMAT_SPEC = """输出格式：
{
  "overall_score": 7.5,
  "dimensions": [
    {"label": "维度名称", "score": 8.0, "comment": "具体分析（至少30字，给出文本依据）", "suggestions": "改进建议（可操作）"}
  ],
  "summary": "对作品的总体评价（100-200字）",
  "suggestions": "针对性的修改建议（100-200字）"
}

要求：
1. dimensions 中的维度 label 必须与上文审稿标准中定义的维度完全一致
2. 每个维度的 comment 至少 30 字，给出具体的文本依据
3. suggestions 要给出可操作的修改方向
4. 评分要有区分度，不要全部集中在 7-8 分
5. overall_score 是七个维度分数的加权平均，不是简单平均"""


def build_review_system_prompt(genre_skill_content: str) -> str:
    """Build system prompt by injecting genre Skill content."""
    return f"""你是一位资深网文编辑，擅长对网络小说进行专业审稿。
你需要对给定的章节内容按照以下编辑标准进行七维诊断分析，输出严格 JSON 格式的结果。

评分标准（1-10分）：
- 1-3分：严重不足，需要大幅修改
- 4-6分：基本合格，有提升空间
- 7-8分：表现不错，具备一定竞争力
- 9-10分：非常出色，接近或达到精品水准

---

## 审稿标准和维度定义

{genre_skill_content}

---

{OUTPUT_FORMAT_SPEC}"""

# ── Idempotency + result cache ──────────────────────────────

_idempotency_store: dict[str, dict] = {}
_result_cache: dict[str, tuple[float, dict]] = {}  # key -> (timestamp, result)
CACHE_TTL = 3600  # 1 hour
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 1.0  # seconds: 1, 2, 4
RETRYABLE_STATUSES = {429, 500, 502, 503, 504}


def _cleanup_expired():
    """Remove expired cache entries."""
    now = time.time()
    expired_keys = [k for k, (ts, _) in _result_cache.items() if now - ts > CACHE_TTL]
    for k in expired_keys:
        del _result_cache[k]
    # Also cleanup old idempotency entries (keep 24h)
    expired_ids = [k for k, v in _idempotency_store.items() if now - v.get("ts", 0) > 86400]
    for k in expired_ids:
        del _idempotency_store[k]


def _cache_key(chapters: list[dict], model_id: str, genre_skill_path: str) -> str:
    content_hash = hashlib.sha256(
        json.dumps([(c["chapter_index"], c["content"]) for c in chapters], sort_keys=True).encode()
    ).hexdigest()
    return f"{content_hash}:{model_id}:{genre_skill_path}"


# ── Prompt builder ──────────────────────────────────────────

def build_review_prompt(chapters: list[dict]) -> str:
    """Build the review prompt from chapter data."""
    parts = []
    for ch in chapters:
        parts.append(
            f"## 第{ch['chapter_index']}章 {ch['title']}\n\n{ch['content']}"
        )
    text = "\n\n".join(parts)
    total_words = sum(ch["word_count"] for ch in chapters)
    return f"以下是待审稿作品的{len(chapters)}个章节（总计约{total_words}字），请进行七维诊断分析：\n\n{text}"


def _is_retryable(status_code: int) -> bool:
    return status_code in RETRYABLE_STATUSES


# ── Main entry point ────────────────────────────────────────

async def call_ai_review(
    chapters: list[dict],
    ai_model_db_id: int,
    genre_skill_content: str,
    genre_skill_path: str,
    db: Session,
    idempotency_key: str | None = None,
) -> dict:
    """
    Call AI API for review with full production hardening:
    - Resolve best platform via model_router
    - Connection pool reuse via http_client_pool
    - Exponential backoff retry (up to 3 attempts)
    - Circuit breaker integration
    - Idempotency key support
    - Result caching (TTL 1h)
    """
    _cleanup_expired()

    # Resolve provider via router
    try:
        resolved = resolve_provider(db, ai_model_db_id)
    except NoProviderAvailableError as e:
        raise ValueError(str(e))

    # Cache check
    cache_key = _cache_key(chapters, resolved.model_id, genre_skill_path)
    if cache_key in _result_cache:
        ts, cached = _result_cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            logger.info("Cache hit for review (model=%s)", resolved.model_id)
            return cached

    # Idempotency check
    if idempotency_key and idempotency_key in _idempotency_store:
        stored = _idempotency_store[idempotency_key]
        if stored.get("result"):
            logger.info("Idempotency hit: %s", idempotency_key)
            return stored["result"]

    system_prompt = build_review_system_prompt(genre_skill_content)
    user_prompt = build_review_prompt(chapters)
    provider_name = resolved.provider_name

    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES):
        try:
            result = await _do_request(resolved, system_prompt, user_prompt)

            # Success — record with circuit breaker and store
            circuit_breaker.record_success(provider_name)
            _result_cache[cache_key] = (time.time(), result)
            if idempotency_key:
                _idempotency_store[idempotency_key] = {"ts": time.time(), "result": result}

            return result

        except httpx.HTTPStatusError as e:
            last_error = e
            if _is_retryable(e.response.status_code):
                logger.warning(
                    "AI API retryable error (attempt %d/%d, status=%d, provider=%s)",
                    attempt + 1, MAX_RETRIES, e.response.status_code, provider_name,
                )
            else:
                logger.error("AI API non-retryable error: %d", e.response.status_code)
                circuit_breaker.record_failure(provider_name)
                raise RuntimeError(f"AI API returned status {e.response.status_code}")

        except (httpx.TimeoutException, httpx.ConnectError, httpx.RemoteProtocolError) as e:
            last_error = e
            logger.warning(
                "AI API network error (attempt %d/%d, provider=%s): %s",
                attempt + 1, MAX_RETRIES, provider_name, e,
            )

        if attempt < MAX_RETRIES - 1:
            delay = RETRY_BACKOFF_BASE * (2 ** attempt)
            await asyncio.sleep(delay)

    # All retries exhausted
    circuit_breaker.record_failure(provider_name)
    raise RuntimeError(f"AI API call failed after {MAX_RETRIES} attempts: {last_error}")


async def _do_request(resolved, system_prompt: str, user_prompt: str) -> dict:
    """Execute a single API request with the resolved provider."""
    client = get_client()

    resp = await client.post(
        f"{resolved.base_url}/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {resolved.api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": resolved.model_id,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.6,
            "response_format": {"type": "json_object"},
        },
    )

    if resp.status_code != 200:
        resp.raise_for_status()

    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    tokens_in = data["usage"]["prompt_tokens"]
    tokens_out = data["usage"]["completion_tokens"]

    result = json.loads(content)

    # Validate dimension completeness — flexible, don't hardcode expected labels

    return {
        "result": result,
        "tokens_input": tokens_in,
        "tokens_output": tokens_out,
    }
