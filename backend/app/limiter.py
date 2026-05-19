from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _get_client_ip(request: Request) -> str:
    """获取真实客户端 IP，优先从 X-Forwarded-For 获取。

    生产环境部署在 Nginx / CDN 后面时，request.client.host 是代理 IP。
    X-Forwarded-For 最左边的 IP 是真实客户端（可被伪造，仅当信任上游代理时使用）。
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


limiter = Limiter(key_func=_get_client_ip, default_limits=["200/day", "50/hour"])
