"""
Circuit breaker for AI API calls.

State machine: CLOSED → OPEN → HALF_OPEN → CLOSED

- CLOSED: Normal, requests pass through
- OPEN: Tripped, requests fail fast (avoid cascading failures)
- HALF_OPEN: Probing, allow 1 request through; success→CLOSED, failure→OPEN

Trigger: 3 consecutive failures within a 60s window
Timeout: 300s (5 minutes) before half-open probe
"""

import time
import threading
from enum import Enum
from collections import defaultdict


class State(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_timeout: float = 300.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._lock = threading.Lock()
        self._states: dict[str, dict] = defaultdict(
            lambda: {"state": State.CLOSED, "failures": 0, "last_failure_time": 0, "opened_at": 0}
        )

    def _key(self, provider_name: str) -> str:
        return provider_name

    def allow_request(self, provider_name: str) -> bool:
        with self._lock:
            entry = self._states[self._key(provider_name)]
            now = time.time()

            if entry["state"] == State.CLOSED:
                # Reset stale failure count
                if now - entry["last_failure_time"] > 60:
                    entry["failures"] = 0
                return True

            if entry["state"] == State.OPEN:
                if now - entry["opened_at"] >= self.recovery_timeout:
                    entry["state"] = State.HALF_OPEN
                    return True
                return False

            if entry["state"] == State.HALF_OPEN:
                # Only allow one probe at a time — first caller gets through, rest fail fast
                return entry["failures"] == 0

            return True

    def record_success(self, provider_name: str):
        with self._lock:
            entry = self._states[self._key(provider_name)]
            entry["state"] = State.CLOSED
            entry["failures"] = 0
            entry["last_failure_time"] = 0

    def record_failure(self, provider_name: str):
        with self._lock:
            entry = self._states[self._key(provider_name)]
            now = time.time()

            if entry["state"] == State.HALF_OPEN:
                entry["state"] = State.OPEN
                entry["failures"] = 0
                entry["opened_at"] = now
                return

            entry["failures"] += 1
            entry["last_failure_time"] = now

            if entry["state"] == State.CLOSED and entry["failures"] >= self.failure_threshold:
                entry["state"] = State.OPEN
                entry["opened_at"] = now

    def get_state(self, provider_name: str) -> State:
        with self._lock:
            return self._states[self._key(provider_name)]["state"]

    def reset(self, provider_name: str):
        with self._lock:
            key = self._key(provider_name)
            self._states[key] = {"state": State.CLOSED, "failures": 0, "last_failure_time": 0, "opened_at": 0}


# Module-level singleton
circuit_breaker = CircuitBreaker()
