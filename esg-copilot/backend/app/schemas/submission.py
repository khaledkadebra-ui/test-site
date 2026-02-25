"""Pydantic schemas for all data input endpoints"""

from typing import Optional
from pydantic import BaseModel, field_validator


class EnergyDataInput(BaseModel):
    # Scope 1 — stationary combustion
    natural_gas_m3: float = 0
    diesel_liters: float = 0
    petrol_liters: float = 0
    lpg_liters: float = 0
    heating_oil_liters: float = 0
    coal_kg: float = 0
    # Scope 1 — mobile combustion
    company_car_km: float = 0
    company_van_km: float = 0
    company_truck_km: float = 0
    # Scope 2
    electricity_kwh: float = 0
    district_heating_kwh: float = 0
    renewable_electricity_pct: float = 0
    notes: Optional[str] = None

    @field_validator("renewable_electricity_pct")
    @classmethod
    def pct_range(cls, v: float) -> float:
        if not 0 <= v <= 100:
            raise ValueError("renewable_electricity_pct must be 0–100")
        return v


class TravelDataInput(BaseModel):
    # Category 6: Business travel
    air_short_haul_km: float = 0
    air_long_haul_km: float = 0
    air_business_class_pct: float = 0
    rail_km: float = 0
    rental_car_km: float = 0
    taxi_km: float = 0
    # Category 7: Employee commuting
    avg_commute_km_one_way: float = 0
    commute_days_per_year: int = 220
    commute_mode_car_pct: float = 60
    commute_mode_transit_pct: float = 25
    commute_mode_active_pct: float = 15

    @field_validator("commute_mode_active_pct")
    @classmethod
    def mode_split_sums_to_100(cls, v: float, info) -> float:
        car = info.data.get("commute_mode_car_pct", 0)
        transit = info.data.get("commute_mode_transit_pct", 0)
        if abs((car + transit + v) - 100) > 1:
            raise ValueError("commute mode splits must sum to 100%")
        return v


class ProcurementDataInput(BaseModel):
    purchased_goods_spend_eur: float = 0
    supplier_count: Optional[int] = None
    has_supplier_code_of_conduct: bool = False
    top_spend_category: Optional[str] = None
    notes: Optional[str] = None


class PolicyDataInput(BaseModel):
    # Environmental
    has_energy_reduction_target: bool = False
    has_net_zero_target: bool = False
    net_zero_target_year: Optional[int] = None
    waste_recycled_pct: Optional[float] = None
    has_waste_policy: bool = False
    has_water_policy: bool = False
    # Social
    has_health_safety_policy: bool = False
    lost_time_injury_rate: Optional[float] = None
    has_training_program: bool = False
    avg_training_hours_per_employee: Optional[float] = None
    has_diversity_policy: bool = False
    female_management_pct: Optional[float] = None
    living_wage_commitment: bool = False
    # Governance
    has_esg_policy: bool = False
    has_code_of_conduct: bool = False
    has_anti_corruption_policy: bool = False
    has_data_privacy_policy: bool = False
    has_board_esg_oversight: bool = False
    esg_reporting_year: Optional[int] = None
    supply_chain_code_of_conduct: bool = False


class VSMEWorkforceDataIn(BaseModel):
    """VSME B8-B10: Medarbejdere, arbejdsmiljø, løn og uddannelse."""
    employees_total: Optional[int] = None
    employees_male: Optional[int] = None
    employees_female: Optional[int] = None
    employees_permanent: Optional[int] = None
    employees_temporary: Optional[int] = None
    employees_full_time: Optional[int] = None
    employees_part_time: Optional[int] = None
    # B9
    accident_count: Optional[int] = 0
    fatalities: Optional[int] = 0
    lost_time_injury_rate: Optional[float] = None
    # B10
    min_wage_pct: Optional[float] = None
    gender_pay_gap_pct: Optional[float] = None
    collective_bargaining_pct: Optional[float] = None
    training_hours_total: Optional[float] = None


class VSMEEnvironmentDataIn(BaseModel):
    """VSME B4-B7: Forurening, biodiversitet, vand og affald."""
    has_pollution_reporting: bool = False
    pollution_notes: Optional[str] = None
    biodiversity_sensitive_sites: Optional[int] = 0
    water_withdrawal_m3: Optional[float] = None
    water_stressed_m3: Optional[float] = None
    waste_total_tonnes: Optional[float] = None
    waste_recycled_pct: Optional[float] = None
    waste_hazardous_tonnes: Optional[float] = None


class CompletenessCheck(BaseModel):
    is_complete: bool
    completion_pct: int
    sections: dict   # section_name -> {complete: bool, missing: [str]}
    blocking_issues: list[str]   # must-fix before report can generate


class SubmissionFull(BaseModel):
    """Full submission with all nested input data."""
    id: str
    company_id: str
    reporting_year: int
    status: str
    energy: Optional[dict] = None
    travel: Optional[dict] = None
    procurement: Optional[dict] = None
    policies: Optional[dict] = None
    created_at: str
