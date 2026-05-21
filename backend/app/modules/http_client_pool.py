"""
Shared httpx.AsyncClient pool for AI API calls.

Reuses TCP connections instead of creating a new client per request.
"""

import httpx

_client: httpx.AsyncClient | None = None
_client_kwargs: dict | None = None


def get_client(**kwargs) -> httpx.AsyncClient:
    """Return a shared AsyncClient, creating it on first call."""
    global _client, _client_kwargs

    merged = {
        "timeout": httpx.Timeout(300),
        "limits": httpx.Limits(max_keepalive_connections=10, max_connections=50),
        **kwargs,
    }

    if _client is None or _client.is_closed or merged != _client_kwargs:
        if _client is not None and not _client.is_closed:
            # Don't await — fire and forget close of old client
            import asyncio
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(_client.aclose())
            except RuntimeError:
                pass
        _client = httpx.AsyncClient(**merged)
        _client_kwargs = merged

    return _client


async def close_client():
    """Close the shared client. Call on app shutdown."""
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
        _client = None
