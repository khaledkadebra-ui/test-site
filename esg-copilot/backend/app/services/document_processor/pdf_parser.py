"""
PDF Parser — ESG Copilot
=========================
Extracts raw text from PDFs, then uses pattern matching + LLM structuring
to pull energy, emissions, and ESG policy data from sustainability reports
and utility bills.

Two-phase approach:
1. PyPDF2 → raw text extraction (deterministic, free)
2. LLM structuring → map text to EnergyDataInput fields (AI, paid)
   LLM is instructed to return ONLY values it finds in the text — never invent.
"""

import re
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class PDFExtractionResult:
    """Raw extraction output before LLM structuring."""
    raw_text: str
    page_count: int
    confidence: str                  # "high" | "medium" | "low"
    detected_document_type: str      # "utility_bill" | "sustainability_report" | "financial" | "unknown"
    extracted_values: dict           # field_name -> value (pattern-matched)
    extraction_warnings: list[str] = field(default_factory=list)


# ── Pattern library for common ESG document fields ───────────────────────────

_PATTERNS = {
    # Electricity
    "electricity_kwh": [
        r"(?:electricity|el\.?|power)[^\d]{0,30}([\d\s,.]+)\s*kwh",
        r"([\d\s,.]+)\s*kwh\s+(?:electricity|consumption|forbrugt)",
        r"elforbrug[^\d]{0,20}([\d\s,.]+)",
    ],
    # Natural gas
    "natural_gas_m3": [
        r"(?:natural gas|naturgas|gas)[^\d]{0,30}([\d\s,.]+)\s*m[³3]",
        r"([\d\s,.]+)\s*m[³3]\s+(?:gas|naturgas)",
        r"gasforbrug[^\d]{0,20}([\d\s,.]+)",
    ],
    # Diesel
    "diesel_liters": [
        r"diesel[^\d]{0,30}([\d\s,.]+)\s*(?:l|liter|litre)",
        r"([\d\s,.]+)\s*(?:l|liter)\s+diesel",
    ],
    # District heating
    "district_heating_kwh": [
        r"(?:district heat|fjernvarme|varme)[^\d]{0,30}([\d\s,.]+)\s*(?:kwh|mwh|gj)",
        r"([\d\s,.]+)\s*(?:kwh|mwh)\s+(?:heat|varme)",
    ],
    # CO2 / GHG
    "co2_total_tonnes": [
        r"(?:total|samlet|co2)[^\d]{0,40}([\d\s,.]+)\s*(?:t\s*co2|tonne|tons?\s+co2|tco2)",
        r"([\d\s,.]+)\s*(?:t|tonnes?)\s+(?:co2|co₂|ghg|greenhouse)",
    ],
    # Employees
    "employee_count": [
        r"(?:employees|medarbejdere|antal ansatte|headcount)[^\d]{0,30}([\d,]+)",
        r"([\d,]+)\s+(?:employees|medarbejdere|fuldtidsansatte|fte)",
    ],
    # Revenue
    "revenue_eur": [
        r"(?:revenue|omsætning|turnover)[^\d]{0,30}([\d\s,.]+)\s*(?:eur|€|dkk|meur|dkk\s+mio)",
    ],
    # Renewable energy %
    "renewable_electricity_pct": [
        r"([\d,.]+)\s*%\s+(?:renewable|vedvarende|green|grøn)\s+(?:energy|electricity)",
        r"(?:renewable|green)\s+energy[^\d]{0,30}([\d,.]+)\s*%",
    ],
}

_DOCTYPE_SIGNALS = {
    "utility_bill": ["invoice", "faktura", "account number", "meter reading", "aflæsning", "kwh", "m3"],
    "sustainability_report": ["sustainability", "esg", "csrd", "scope", "ghg protocol", "bæredygtighed"],
    "financial": ["annual report", "årsrapport", "balance sheet", "profit", "revenue", "omsætning"],
}


class PDFParser:
    """
    Parses PDF documents and extracts ESG-relevant data fields.

    Usage:
        parser = PDFParser()
        result = parser.parse(pdf_bytes)
        structured = await parser.structure_with_llm(result)
    """

    def parse(self, content: bytes) -> PDFExtractionResult:
        """Extract text and run pattern matching. No LLM involved."""
        try:
            import PyPDF2
            import io
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            pages = []
            for page in reader.pages:
                try:
                    pages.append(page.extract_text() or "")
                except Exception as e:
                    logger.warning("Could not extract page: %s", e)
                    pages.append("")

            raw_text = "\n".join(pages)
            page_count = len(reader.pages)

        except Exception as e:
            return PDFExtractionResult(
                raw_text="",
                page_count=0,
                confidence="low",
                detected_document_type="unknown",
                extracted_values={},
                extraction_warnings=[f"PDF parsing failed: {e}"],
            )

        doc_type = self._detect_document_type(raw_text)
        values = self._pattern_match(raw_text)
        confidence = "high" if len(values) >= 3 else "medium" if values else "low"

        return PDFExtractionResult(
            raw_text=raw_text,
            page_count=page_count,
            confidence=confidence,
            detected_document_type=doc_type,
            extracted_values=values,
        )

    async def structure_with_llm(
        self,
        result: PDFExtractionResult,
        llm_client=None,
    ) -> dict:
        """
        Use LLM to map extracted text to structured fields.
        Returns a dict matching EnergyDataInput fields.
        LLM is instructed to return null for any value it cannot find — never guess.
        """
        if llm_client is None:
            return result.extracted_values

        # Truncate to avoid massive token usage — first 6000 chars covers most utility bills
        text_snippet = result.raw_text[:6000]

        system = (
            "You are a data extraction assistant. Extract ONLY values explicitly stated in the "
            "document text. If a value is not clearly present, return null. Never estimate or invent numbers. "
            "Return valid JSON only."
        )
        prompt = f"""Extract ESG data from this document (type: {result.detected_document_type}).

DOCUMENT TEXT:
{text_snippet}

Return a JSON object with these keys (use null if not found in the text):
{{
  "electricity_kwh": number | null,
  "natural_gas_m3": number | null,
  "diesel_liters": number | null,
  "heating_oil_liters": number | null,
  "district_heating_kwh": number | null,
  "renewable_electricity_pct": number | null,
  "employee_count": number | null,
  "co2_total_tonnes": number | null,
  "document_period": "string describing the period (year, quarter) or null"
}}

Return only valid JSON. No explanation."""

        try:
            raw = await llm_client.generate(system, prompt, max_tokens=400)
            import json
            # Strip markdown code fences if present
            clean = re.sub(r"```(?:json)?|```", "", raw).strip()
            return json.loads(clean)
        except Exception as e:
            logger.warning("LLM structuring failed: %s. Falling back to pattern matches.", e)
            return result.extracted_values

    # ── Private helpers ───────────────────────────────────────────────────────

    def _detect_document_type(self, text: str) -> str:
        text_lower = text.lower()
        scores = {dtype: 0 for dtype in _DOCTYPE_SIGNALS}
        for dtype, signals in _DOCTYPE_SIGNALS.items():
            for signal in signals:
                if signal in text_lower:
                    scores[dtype] += 1
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else "unknown"

    def _pattern_match(self, text: str) -> dict:
        text_lower = text.lower()
        found = {}
        for field_name, patterns in _PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, text_lower, re.IGNORECASE)
                if match:
                    raw = match.group(1).replace(" ", "").replace(",", ".")
                    try:
                        found[field_name] = float(raw)
                        break
                    except ValueError:
                        continue
        return found
