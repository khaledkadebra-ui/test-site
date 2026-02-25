"""
LLM Client — ESG Copilot
==========================
Thin wrapper around Anthropic Claude API for narrative generation only.

Rules:
- Temperature kept at 0.3 for consistent, factual output
- All prompts must include calculated numbers — LLM never invents figures
- Retry on transient errors (rate limits, timeouts)
"""

import os
import logging
from typing import Optional

import anthropic

logger = logging.getLogger(__name__)

MAX_RETRIES = 5
RETRY_DELAY_SECONDS = 3


class LLMClient:
    """
    Anthropic Claude API wrapper for structured narrative generation.

    Usage:
        client = LLMClient()
        text = await client.generate(system_prompt, user_prompt)
    """

    def __init__(self):
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
        self.temperature = 0.3       # Low = more deterministic, less hallucination
        self.default_max_tokens = 2000

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Generate narrative text. Retries up to MAX_RETRIES on transient errors.
        Raises RuntimeError if all retries exhausted.
        """
        import asyncio

        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = await self.client.messages.create(
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=max_tokens or self.default_max_tokens,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": user_prompt},
                    ],
                )
                return response.content[0].text if response.content else ""

            except anthropic.RateLimitError as e:
                logger.warning("Anthropic rate limit hit (attempt %d/%d). Waiting %ds.", attempt, MAX_RETRIES, RETRY_DELAY_SECONDS * attempt)
                last_error = e
                await asyncio.sleep(RETRY_DELAY_SECONDS * attempt)

            except anthropic.InternalServerError as e:
                # 529 Overloaded — always retry with backoff
                logger.warning("Anthropic overloaded (attempt %d/%d). Waiting %ds.", attempt, MAX_RETRIES, RETRY_DELAY_SECONDS * attempt)
                last_error = e
                await asyncio.sleep(RETRY_DELAY_SECONDS * attempt)

            except (anthropic.APITimeoutError, anthropic.APIConnectionError) as e:
                logger.warning("Anthropic transient error (attempt %d/%d): %s", attempt, MAX_RETRIES, e)
                last_error = e
                await asyncio.sleep(RETRY_DELAY_SECONDS)

        raise RuntimeError(f"LLM generation failed after {MAX_RETRIES} retries: {last_error}")
