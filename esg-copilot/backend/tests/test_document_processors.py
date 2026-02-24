"""
Tests for PDF and Excel parsers.
Run: pytest tests/test_document_processors.py -v
"""

import pytest
from app.services.document_processor.excel_parser import ExcelParser


class TestExcelParser:
    def test_parse_empty_bytes_returns_gracefully(self):
        parser = ExcelParser()
        result = parser.parse(b"", filename="test.xlsx")
        assert result.rows_found == 0
        assert len(result.extraction_warnings) > 0
        assert result.confidence == "low"

    def test_parse_csv_with_known_headers(self):
        parser = ExcelParser()
        csv_content = b"electricity_kwh,diesel_liters,employee_count\n5000,200,30\n3000,100,0\n"
        result = parser.parse(csv_content, filename="energy.csv")
        assert result.extracted_values.get("electricity_kwh") == pytest.approx(8000)
        assert result.extracted_values.get("diesel_liters") == pytest.approx(300)
        assert result.extracted_values.get("employee_count") == pytest.approx(30)

    def test_parse_csv_unknown_headers_gives_low_confidence(self):
        parser = ExcelParser()
        csv_content = b"col_a,col_b,col_c\n1,2,3\n"
        result = parser.parse(csv_content, filename="unknown.csv")
        assert result.confidence == "low"
        assert len(result.extraction_warnings) > 0

    def test_parse_csv_with_commas_in_numbers(self):
        parser = ExcelParser()
        csv_content = b"electricity_kwh,employee_count\n\"1,500\",25\n"
        result = parser.parse(csv_content, filename="data.csv")
        # 1500 after comma removal
        assert result.extracted_values.get("electricity_kwh") == pytest.approx(1500)

    def test_parse_csv_alternate_column_names(self):
        parser = ExcelParser()
        # Use column name alias
        csv_content = b"electricity (kwh),employees\n10000,50\n"
        result = parser.parse(csv_content, filename="data.csv")
        assert result.extracted_values.get("electricity_kwh") == pytest.approx(10000)
        assert result.extracted_values.get("employee_count") == pytest.approx(50)


class TestPDFParserPatterns:
    """Test pattern matching without needing actual PDF bytes."""

    def test_pattern_match_electricity(self):
        from app.services.document_processor.pdf_parser import PDFParser
        parser = PDFParser()
        text = "Total electricity consumption: 45,000 kWh for the period."
        values = parser._pattern_match(text)
        assert "electricity_kwh" in values
        assert values["electricity_kwh"] == pytest.approx(45000)

    def test_pattern_match_natural_gas(self):
        from app.services.document_processor.pdf_parser import PDFParser
        parser = PDFParser()
        text = "Natural gas usage was 1.200 m³ in Q4."
        values = parser._pattern_match(text)
        assert "natural_gas_m3" in values

    def test_detect_utility_bill(self):
        from app.services.document_processor.pdf_parser import PDFParser
        parser = PDFParser()
        doc_type = parser._detect_document_type("invoice account number meter reading kwh consumption")
        assert doc_type == "utility_bill"

    def test_detect_sustainability_report(self):
        from app.services.document_processor.pdf_parser import PDFParser
        parser = PDFParser()
        doc_type = parser._detect_document_type("esg sustainability report scope 1 ghg protocol emissions")
        assert doc_type == "sustainability_report"
