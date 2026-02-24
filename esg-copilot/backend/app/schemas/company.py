"""Pydantic schemas for company endpoints"""

from typing import Optional
from pydantic import BaseModel, field_validator

VALID_INDUSTRY_CODES = {
    "general", "manufacturing", "heavy_manufacturing", "construction",
    "retail", "logistics", "finance", "technology", "healthcare",
    "food_beverage", "agriculture", "energy", "professional_services",
    "hospitality", "education",
}


class CompanyCreate(BaseModel):
    name: str
    industry_code: str
    country_code: str
    registration_number: Optional[str] = None
    nace_code: Optional[str] = None
    city: Optional[str] = None
    employee_count: Optional[int] = None
    revenue_eur: Optional[float] = None
    fiscal_year_end: Optional[str] = None

    @field_validator("industry_code")
    @classmethod
    def valid_industry(cls, v: str) -> str:
        if v not in VALID_INDUSTRY_CODES:
            raise ValueError(f"industry_code must be one of: {sorted(VALID_INDUSTRY_CODES)}")
        return v

    @field_validator("country_code")
    @classmethod
    def valid_country(cls, v: str) -> str:
        if len(v) != 2 or not v.isalpha():
            raise ValueError("country_code must be a 2-letter ISO 3166-1 alpha-2 code")
        return v.upper()


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry_code: Optional[str] = None
    country_code: Optional[str] = None
    city: Optional[str] = None
    employee_count: Optional[int] = None
    revenue_eur: Optional[float] = None
    fiscal_year_end: Optional[str] = None


class CompanyOut(BaseModel):
    id: str
    name: str
    industry_code: str
    country_code: str
    registration_number: Optional[str]
    nace_code: Optional[str]
    city: Optional[str]
    employee_count: Optional[int]
    revenue_eur: Optional[float]
    fiscal_year_end: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}

    def model_post_init(self, __context) -> None:
        # Serialize UUIDs and datetimes to strings
        if hasattr(self, "id") and not isinstance(self.id, str):
            object.__setattr__(self, "id", str(self.id))
        if hasattr(self, "created_at") and not isinstance(self.created_at, str):
            object.__setattr__(self, "created_at", self.created_at.isoformat())


class SubmissionCreate(BaseModel):
    reporting_year: int

    @field_validator("reporting_year")
    @classmethod
    def valid_year(cls, v: int) -> int:
        if v < 2000 or v > 2100:
            raise ValueError("reporting_year must be a valid year")
        return v


class SubmissionOut(BaseModel):
    id: str
    company_id: str
    reporting_year: int
    status: str
    created_at: str

    model_config = {"from_attributes": True}
