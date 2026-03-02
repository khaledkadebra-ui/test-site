"""
DataExtractionAgent
====================
Wraps the existing extract_document_data() Claude vision function into
the agent pattern. Handles file loading from S3/local path or raw bytes,
runs extraction, and returns structured results with pre-fill suggestions
for the VSME wizard.

This agent is invoked when:
  - A user uploads an invoice/bill/report to auto-fill the wizard
  - The orchestrator needs to extract data from a document in context
"""

from __future__ import annotations

from typing import Any

from .base import BaseAgent
from ..ai.document_extractor import extract_document_data, DocumentType

# Maps extracted field names → wizard form field paths (section.field)
_WIZARD_MAP: dict[str, str] = {
    "electricity_kwh":       "scope2.electricity_kwh",
    "district_heating_kwh":  "scope2.district_heating_kwh",
    "natural_gas_m3":        "scope1.natural_gas_m3",
    "diesel_liters":         "scope1.diesel_liters",
    "petrol_liters":         "scope1.petrol_liters",
    "lpg_liters":            "scope1.lpg_liters",
    "water_withdrawal_m3":   "environment.water_m3",
    "total_waste_tonnes":    "environment.waste_total_tonnes",
    "hazardous_waste_tonnes":"environment.hazardous_waste_tonnes",
    "waste_recycled_pct":    "environment.waste_recycled_pct",
}


class DataExtractionAgent(BaseAgent):
    """
    Extracts ESG data from documents using Claude vision.
    Returns extracted fields + wizard pre-fill suggestions.
    """

    name = "DataExtractionAgent"

    async def run(self, inputs: dict[str, Any]) -> dict[str, Any]:
        """
        inputs:
          file_bytes:      bytes  — raw file content
          file_extension:  str    — 'pdf', 'jpg', 'png', etc.
          document_type:   str    — 'electricity_bill' | 'gas_invoice' | 'water_bill' |
                                    'fuel_receipt' | 'waste_invoice' | 'general'
        """
        file_bytes = inputs.get("file_bytes")
        if not file_bytes:
            return {"ok": False, "error": "file_bytes required"}

        extension  = str(inputs.get("file_extension", "pdf")).lower().lstrip(".")
        doc_type   = inputs.get("document_type", "general")

        # Validate document_type
        valid_types = {"electricity_bill", "gas_invoice", "water_bill", "fuel_receipt", "waste_invoice", "general"}
        if doc_type not in valid_types:
            doc_type = "general"

        result = await extract_document_data(
            file_bytes=file_bytes,
            file_extension=extension,
            document_type=doc_type,  # type: ignore[arg-type]
        )

        # Build wizard pre-fill suggestions (only high-confidence fields)
        prefill: dict[str, Any] = {}
        if result.get("confidence", 0) >= 0.5:
            for field, value in result.get("fields", {}).items():
                if value is not None and field in _WIZARD_MAP:
                    prefill[_WIZARD_MAP[field]] = value

        return {
            "ok":           True,
            "fields":       result.get("fields", {}),
            "confidence":   result.get("confidence", 0),
            "document_type": result.get("document_type", doc_type),
            "prefill":      prefill,
            "prefill_count": len(prefill),
            "raw_excerpt":  result.get("raw_text_excerpt", "")[:500],
        }
