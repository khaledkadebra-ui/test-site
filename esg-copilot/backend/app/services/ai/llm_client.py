"""
LLM Client — ESG Copilot
==========================
Thin wrapper around OpenAI API for narrative generation only.

Rules:
- Temperature kept at 0.3 for consistent, factual output
- All prompts must include calculated numbers — LLM never invents figures
- Retry on transient errors (rate limits, timeouts)
"""

import os
import logging
from typing import Optional

from openai import AsyncOpenAI, RateLimitError, APITimeoutError, APIConnectionError

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


class LLMClient:
    """
    OpenAI API wrapper for structured narrative generation.

    Usage:
        client = LLMClient()
        text = await client.generate(system_prompt, user_prompt)
    """

    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
        self.model = os.environ.get("OPENAI_MODEL", "gpt-4o")
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
                response = await self.client.chat.completions.create(
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=max_tokens or self.default_max_tokens,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                )
                return response.choices[0].message.content or ""

            except RateLimitError as e:
                logger.warning("OpenAI rate limit hit (attempt %d/%d). Waiting %ds.", attempt, MAX_RETRIES, RETRY_DELAY_SECONDS * attempt)
                last_error = e
                await asyncio.sleep(RETRY_DELAY_SECONDS * attempt)

            except (APITimeoutError, APIConnectionError) as e:
                logger.warning("OpenAI transient error (attempt %d/%d): %s", attempt, MAX_RETRIES, e)
                last_error = e
                await asyncio.sleep(RETRY_DELAY_SECONDS)

        raise RuntimeError(f"LLM generation failed after {MAX_RETRIES} retries: {last_error}")
