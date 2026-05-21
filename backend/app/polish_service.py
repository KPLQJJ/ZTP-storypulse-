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

OUTPUT_FORMAT_SPEC = """输出格式：
{
  "chapters": [
    {
      "chapter_index": 1,
      "title": "章节标题",
      "original_text": "原文内容（与输入一致）",
      "polished_text": "润色后的完整文本",
      "changes_summary": "30-80字的修改说明，概括主要做了哪些优化"
    }
  ]
}

要求：
1. polished_text 必须是完整的润色后文本，不是片段
2. changes_summary 控制在 30-80 字，用中文概括修改要点
3. 对每一章独立润色，保持章节间的连贯性
4. 对话部分谨慎修改，保持人物语言特色
5. 严格遵循上文「品类编辑标准」和「风格转换要求」中的每一条规则"""

# ── Idempotency + result cache ──────────────────────────────

_idempotency_store: dict[str, dict] = {}
_result_cache: dict[str, tuple[float, dict]] = {}
CACHE_TTL = 3600
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 1.0
RETRYABLE_STATUSES = {429, 500, 502, 503, 504}


def _cleanup_expired():
    now = time.time()
    expired_keys = [k for k, (ts, _) in _result_cache.items() if now - ts > CACHE_TTL]
    for k in expired_keys:
        del _result_cache[k]
    expired_ids = [k for k, v in _idempotency_store.items() if now - v.get("ts", 0) > 86400]
    for k in expired_ids:
        del _idempotency_store[k]


def _cache_key(chapters: list[dict], model_id: str, genre_skill_path: str, style_skill_path: str) -> str:
    content_hash = hashlib.sha256(
        json.dumps(
            [(c["chapter_index"], c["content"]) for c in chapters], sort_keys=True
        ).encode()
    ).hexdigest()
    return f"{content_hash}:{model_id}:{genre_skill_path}:{style_skill_path}"


def _is_retryable(status_code: int) -> bool:
    return status_code in RETRYABLE_STATUSES


# ── Prompt builders ─────────────────────────────────────────

def build_polish_system_prompt(genre_skill_content: str, style_skill_content: str) -> str:
    """Build system prompt by injecting genre and style Skill content."""
    return f"""你是一位资深网文编辑，擅长对网络小说进行专业文字润色。
你需要对给定的章节内容按照以下编辑标准进行优化，输出严格 JSON 格式的结果。

核心原则：
1. 保留原意：不改变情节走向、人物性格、对话意图和世界观设定
2. 只改表达：优化语言表达方式，不改故事内容
3. 保持风格：保留作者原有的叙事风格和人物声音
4. 逐章输出：为每一章分别输出原文和润色后的版本

---

## 品类编辑标准

{genre_skill_content}

---

## 风格转换要求

{style_skill_content}

---

{OUTPUT_FORMAT_SPEC}"""


def build_polish_user_prompt(chapters: list[dict]) -> str:
    """Build the user prompt with chapter content."""
    parts = []
    for ch in chapters:
        parts.append(
            f"## 第{ch['chapter_index']}章 {ch['title']}\n\n{ch['content']}"
        )
    text = "\n\n".join(parts)
    total_words = sum(ch["word_count"] for ch in chapters)
    return f"以下是待润色的{len(chapters)}个章节（总计约{total_words}字）：\n\n{text}"


# ── Main entry point ────────────────────────────────────────

async def call_ai_polish(
    chapters: list[dict],
    ai_model_db_id: int,
    genre_skill_content: str,
    style_skill_content: str,
    genre_skill_path: str,
    style_skill_path: str,
    db: Session,
    idempotency_key: str | None = None,
) -> dict:
    _cleanup_expired()

    try:
        resolved = resolve_provider(db, ai_model_db_id)
    except NoProviderAvailableError as e:
        raise ValueError(str(e))

    cache_key = _cache_key(chapters, resolved.model_id, genre_skill_path, style_skill_path)
    if cache_key in _result_cache:
        ts, cached = _result_cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            logger.info("Cache hit for polish (model=%s)", resolved.model_id)
            return cached

    if idempotency_key and idempotency_key in _idempotency_store:
        stored = _idempotency_store[idempotency_key]
        if stored.get("result"):
            logger.info("Idempotency hit: %s", idempotency_key)
            return stored["result"]

    system_prompt = build_polish_system_prompt(genre_skill_content, style_skill_content)
    user_prompt = build_polish_user_prompt(chapters)
    provider_name = resolved.provider_name

    last_error: Exception | None = None

    for attempt in range(MAX_RETRIES):
        try:
            result = await _do_request(resolved, system_prompt, user_prompt)

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

    circuit_breaker.record_failure(provider_name)
    raise RuntimeError(f"AI API call failed after {MAX_RETRIES} attempts: {last_error}")


async def _do_request(resolved, system_prompt: str, user_prompt: str) -> dict:
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
            "temperature": 0.7,
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

    chapters_result = result.get("chapters", [])
    if not isinstance(chapters_result, list) or len(chapters_result) == 0:
        raise ValueError("AI 返回的润色结果为空或格式不正确")

    for ch in chapters_result:
        if not all(k in ch for k in ("chapter_index", "title", "original_text", "polished_text", "changes_summary")):
            raise ValueError("AI 返回的章节结果缺少必要字段")

    return {
        "result": result,
        "tokens_input": tokens_in,
        "tokens_output": tokens_out,
    }
