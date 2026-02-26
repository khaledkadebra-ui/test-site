"""
Document Extraction Agent — ESG Copilot
=========================================
Uses Claude's vision capability to extract structured ESG data from
uploaded documents (PDF invoices, energy bills, waste reports, etc.).

The agent receives the file bytes + context hint and returns structured
fields with confidence scores. This is an AI agent because Claude must
read and reason about unstructured document content to extract values.

Supported document types:
  - electricity_bill    → electricity_kwh, billing_period, tariff
  - gas_invoice         → natural_gas_m3, billing_period
  - water_bill          → water_withdrawal_m3, billing_period
  - fuel_receipt        → diesel_liters | petrol_liters, date
  - waste_invoice       → total_waste_tonnes, hazardous_waste_tonnes, recycled_pct
  - general             → extracts any ESG-relevant numeric values
"""

import base64
import json
import logging
import os
import re
from typing import Literal, TypedDict

import anthropic

logger = logging.getLogger(__name__)

DocumentType = Literal[
    "electricity_bill", "gas_invoice", "water_bill",
    "fuel_receipt", "waste_invoice", "general"
]

# Field descriptions for each document type — tells Claude what to look for
_FIELD_TARGETS: dict[str, dict] = {
    "electricity_bill": {
        "fields": ["electricity_kwh", "billing_period_start", "billing_period_end", "tariff_dkk_per_kwh"],
        "description": "elregning / strømregning",
        "instructions": (
            "Find det samlede elforbrug i kWh for faktureringsperioden. "
            "Find faktureringsperioden (start- og slutdato). "
            "Find evt. tariffen (kr/kWh)."
        ),
    },
    "gas_invoice": {
        "fields": ["natural_gas_m3", "natural_gas_kwh", "billing_period_start", "billing_period_end"],
        "description": "gasregning / naturgasfaktura",
        "instructions": (
            "Find det samlede naturgasforbrug i m³ eller kWh. "
            "Find faktureringsperioden."
        ),
    },
    "water_bill": {
        "fields": ["water_withdrawal_m3", "billing_period_start", "billing_period_end"],
        "description": "vandregning",
        "instructions": (
            "Find det samlede vandforbrug i m³. "
            "Find faktureringsperioden."
        ),
    },
    "fuel_receipt": {
        "fields": ["diesel_liters", "petrol_liters", "lpg_liters", "date", "total_dkk"],
        "description": "brændstofkvittering / tankbon",
        "instructions": (
            "Find mængden af diesel (liter), benzin (liter) eller LPG (liter). "
            "Find datoen og det samlede beløb."
        ),
    },
    "waste_invoice": {
        "fields": ["total_waste_tonnes", "hazardous_waste_tonnes", "waste_recycled_pct", "billing_period_start"],
        "description": "affaldsopgørelse / affaldsregning",
        "instructions": (
            "Find den samlede affaldsmængde (tonnes eller kg — konverter til tonnes). "
            "Find farligt affald og genanvendelsesprocent."
        ),
    },
    "general": {
        "fields": [
            "electricity_kwh", "natural_gas_m3", "water_withdrawal_m3",
            "diesel_liters", "petrol_liters", "total_waste_tonnes",
            "billing_period_start", "billing_period_end",
        ],
        "description": "ESG-relateret dokument",
        "instructions": (
            "Identificer alle ESG-relevante numeriske værdier: "
            "elforbrug, gasforbrug, vandforbrug, brændstof, affald, osv."
        ),
    },
}

_SYSTEM = """\
Du er en ekspert i at læse og fortolke fakturaer, regninger og forretningsdokumenter.
Din opgave er at udtrække præcise numeriske værdier fra dokumentet.

REGLER:
1. Returnér KUN de værdier du er SIKKER på at have fundet i dokumentet
2. Lad felter være null hvis du ikke kan finde en sikker værdi
3. Konvertér enheder korrekt: kg → tonnes ved at dividere med 1000
4. Returnér tal som numbers (ikke strings)
5. Datoer som "YYYY-MM-DD" strings
6. confidence: 0.0-1.0 (din sikkerhed for det samlede udtræk)
7. Returnér KUN valid JSON — ingen forklaring udenfor JSON
"""


class ExtractionResult(TypedDict):
    fields: dict[str, float | str | None]
    confidence: float
    document_type: str
    raw_text_excerpt: str


async def extract_document_data(
    file_bytes: bytes,
    file_extension: str,
    document_type: DocumentType = "general",
) -> ExtractionResult:
    """
    Extract structured ESG data from a document using Claude vision.

    Args:
        file_bytes: Raw file content
        file_extension: ".pdf", ".jpg", ".png", etc.
        document_type: Hint about the document category

    Returns:
        ExtractionResult with extracted fields, confidence, and raw excerpt
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set")

    model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
    client = anthropic.AsyncAnthropic(api_key=api_key)

    target = _FIELD_TARGETS.get(document_type, _FIELD_TARGETS["general"])
    fields_list = "\n".join(f'    "{f}": <number|string|null>' for f in target["fields"])

    # Build content — Claude can read PDFs and images natively
    content_type, encoded = _encode_file(file_bytes, file_extension)

    user_prompt = f"""\
Dette er en {target["description"]}.

{target["instructions"]}

Returner præcis dette JSON-format:
{{
  "fields": {{
{fields_list}
  }},
  "confidence": <0.0-1.0>,
  "raw_text_excerpt": "<de 2-3 vigtigste linjer du baserede udtræk på>"
}}
"""

    logger.info("Running document extraction: type=%s ext=%s size=%d bytes", document_type, file_extension, len(file_bytes))

    import asyncio
    last_err = None
    for attempt in range(1, 4):
        try:
            response = await client.messages.create(
                model=model,
                max_tokens=1000,
                temperature=0.1,   # Very low — extraction should be deterministic
                system=_SYSTEM,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "document" if file_extension == ".pdf" else "image",
                            "source": {
                                "type": "base64",
                                "media_type": content_type,
                                "data": encoded,
                            },
                        },
                        {"type": "text", "text": user_prompt},
                    ],
                }],
            )
            raw = response.content[0].text.strip() if response.content else "{}"
            break
        except (anthropic.RateLimitError, anthropic.InternalServerError) as e:
            logger.warning("Document extractor attempt %d failed: %s", attempt, e)
            last_err = e
            await asyncio.sleep(5 * attempt)
    else:
        raise RuntimeError(f"Document extraction failed after retries: {last_err}")

    result = _parse_extraction_response(raw, document_type)
    logger.info(
        "Extraction complete: %d fields found, confidence=%.2f",
        sum(1 for v in result["fields"].values() if v is not None),
        result["confidence"],
    )
    return result


def _encode_file(file_bytes: bytes, ext: str) -> tuple[str, str]:
    """Encode file to base64 and determine media type."""
    encoded = base64.standard_b64encode(file_bytes).decode("utf-8")
    media_types = {
        ".pdf":  "application/pdf",
        ".jpg":  "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png":  "image/png",
        ".gif":  "image/gif",
        ".webp": "image/webp",
    }
    media_type = media_types.get(ext.lower(), "application/octet-stream")
    return media_type, encoded


def _parse_extraction_response(raw: str, document_type: str) -> ExtractionResult:
    """Parse Claude's extraction JSON response."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    try:
        data = json.loads(cleaned)
        return ExtractionResult(
            fields=data.get("fields", {}),
            confidence=float(data.get("confidence", 0.5)),
            document_type=document_type,
            raw_text_excerpt=data.get("raw_text_excerpt", ""),
        )
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("Failed to parse extraction JSON: %s\nRaw: %s", e, raw[:300])
        target = _FIELD_TARGETS.get(document_type, _FIELD_TARGETS["general"])
        return ExtractionResult(
            fields={f: None for f in target["fields"]},
            confidence=0.0,
            document_type=document_type,
            raw_text_excerpt="Udtræk mislykkedes.",
        )
