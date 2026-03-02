"""
BaseAgent — shared interface for all ESG Copilot specialist agents.

Each agent:
  - Receives a typed input dict
  - Returns a typed output dict
  - Logs its work for the orchestrator's trace
  - Optionally uses the LLMClient for narrative output
"""

from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base class every specialist agent must inherit from."""

    #: Human-readable agent name (used in traces + prompts)
    name: str = "BaseAgent"

    def __init__(self) -> None:
        self._logger = logging.getLogger(f"agents.{self.name}")

    @abstractmethod
    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        Execute the agent's task.

        Args:
            inputs: Task-specific inputs (see each agent's docstring).

        Returns:
            Task-specific outputs, always including:
              - "agent": str  — this agent's name
              - "ok": bool    — success flag
              - "error": str | None — error message if ok=False
        """

    async def safe_run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """Wrapper that catches exceptions and returns a structured error response."""
        t0 = time.monotonic()
        try:
            result = await self.run(inputs)
            elapsed = time.monotonic() - t0
            self._logger.info("completed in %.2fs", elapsed)
            return {**result, "agent": self.name, "ok": result.get("ok", True), "elapsed_s": round(elapsed, 2)}
        except Exception as exc:
            elapsed = time.monotonic() - t0
            self._logger.error("failed after %.2fs: %s", elapsed, exc, exc_info=True)
            return {
                "agent": self.name,
                "ok": False,
                "error": str(exc),
                "elapsed_s": round(elapsed, 2),
            }
