"""SQLAlchemy DataSubmission + input data models"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DataSubmission(Base):
    __tablename__ = "data_submissions"
    __table_args__ = (UniqueConstraint("company_id", "reporting_year"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    reporting_year: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="incomplete")
    submitted_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    company: Mapped["Company"] = relationship("Company", back_populates="submissions")  # type: ignore[name-defined]
    energy_data: Mapped["EnergyData | None"] = relationship("EnergyData", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    travel_data: Mapped["TravelData | None"] = relationship("TravelData", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    procurement_data: Mapped["ProcurementData | None"] = relationship("ProcurementData", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    policy_data: Mapped["ESGPolicyData | None"] = relationship("ESGPolicyData", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    workforce_data: Mapped["VSMEWorkforceData | None"] = relationship("VSMEWorkforceData", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    environment_data: Mapped["VSMEEnvironmentData | None"] = relationship("VSMEEnvironmentData", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="submission")  # type: ignore[name-defined]


class EnergyData(Base):
    __tablename__ = "energy_data"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("data_submissions.id", ondelete="CASCADE"), nullable=False)

    natural_gas_m3: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    diesel_liters: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    petrol_liters: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    lpg_liters: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    heating_oil_liters: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    coal_kg: Mapped[float] = mapped_column(Numeric(15, 2), default=0)

    company_car_km: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    company_van_km: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    company_truck_km: Mapped[float] = mapped_column(Numeric(15, 2), default=0)

    electricity_kwh: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    district_heating_kwh: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    renewable_electricity_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0)

    source_document_url: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    submission: Mapped[DataSubmission] = relationship("DataSubmission", back_populates="energy_data")


class TravelData(Base):
    __tablename__ = "travel_data"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("data_submissions.id", ondelete="CASCADE"), nullable=False)

    air_short_haul_km: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    air_long_haul_km: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    air_business_class_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    rail_km: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    rental_car_km: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    taxi_km: Mapped[float] = mapped_column(Numeric(15, 2), default=0)

    avg_commute_km_one_way: Mapped[float] = mapped_column(Numeric(8, 2), default=0)
    commute_days_per_year: Mapped[int] = mapped_column(Integer, default=220)
    commute_mode_car_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=60)
    commute_mode_transit_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=25)
    commute_mode_active_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=15)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    submission: Mapped[DataSubmission] = relationship("DataSubmission", back_populates="travel_data")


class ProcurementData(Base):
    __tablename__ = "procurement_data"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("data_submissions.id", ondelete="CASCADE"), nullable=False)

    purchased_goods_spend_eur: Mapped[float] = mapped_column(Numeric(20, 2), default=0)
    supplier_count: Mapped[int | None] = mapped_column(Integer)
    has_supplier_code_of_conduct: Mapped[bool] = mapped_column(Boolean, default=False)
    top_spend_category: Mapped[str | None] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    submission: Mapped[DataSubmission] = relationship("DataSubmission", back_populates="procurement_data")


class ESGPolicyData(Base):
    __tablename__ = "esg_policy_data"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("data_submissions.id", ondelete="CASCADE"), nullable=False)

    # Environmental
    has_energy_reduction_target: Mapped[bool] = mapped_column(Boolean, default=False)
    has_net_zero_target: Mapped[bool] = mapped_column(Boolean, default=False)
    net_zero_target_year: Mapped[int | None] = mapped_column(Integer)
    waste_recycled_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    has_waste_policy: Mapped[bool] = mapped_column(Boolean, default=False)
    has_water_policy: Mapped[bool] = mapped_column(Boolean, default=False)

    # Social
    has_health_safety_policy: Mapped[bool] = mapped_column(Boolean, default=False)
    lost_time_injury_rate: Mapped[float | None] = mapped_column(Numeric(8, 4))
    has_training_program: Mapped[bool] = mapped_column(Boolean, default=False)
    avg_training_hours_per_employee: Mapped[float | None] = mapped_column(Numeric(8, 2))
    has_diversity_policy: Mapped[bool] = mapped_column(Boolean, default=False)
    female_management_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    living_wage_commitment: Mapped[bool] = mapped_column(Boolean, default=False)

    # Governance
    has_esg_policy: Mapped[bool] = mapped_column(Boolean, default=False)
    has_code_of_conduct: Mapped[bool] = mapped_column(Boolean, default=False)
    has_anti_corruption_policy: Mapped[bool] = mapped_column(Boolean, default=False)
    has_data_privacy_policy: Mapped[bool] = mapped_column(Boolean, default=False)
    has_board_esg_oversight: Mapped[bool] = mapped_column(Boolean, default=False)
    esg_reporting_year: Mapped[int | None] = mapped_column(Integer)
    supply_chain_code_of_conduct: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    submission: Mapped[DataSubmission] = relationship("DataSubmission", back_populates="policy_data")


class VSMEWorkforceData(Base):
    """VSME B8 (Medarbejderkarakteristika), B9 (Arbejdsmiljø), B10 (Løn og uddannelse)."""
    __tablename__ = "vsme_workforce_data"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("data_submissions.id", ondelete="CASCADE"), nullable=False)

    # B8 — Medarbejderkarakteristika
    employees_total: Mapped[int | None] = mapped_column(Integer)
    employees_male: Mapped[int | None] = mapped_column(Integer)
    employees_female: Mapped[int | None] = mapped_column(Integer)
    employees_permanent: Mapped[int | None] = mapped_column(Integer)
    employees_temporary: Mapped[int | None] = mapped_column(Integer)
    employees_full_time: Mapped[int | None] = mapped_column(Integer)
    employees_part_time: Mapped[int | None] = mapped_column(Integer)

    # B9 — Arbejdsmiljø og sikkerhed
    accident_count: Mapped[int | None] = mapped_column(Integer, default=0)
    fatalities: Mapped[int | None] = mapped_column(Integer, default=0)
    lost_time_injury_rate: Mapped[float | None] = mapped_column(Numeric(8, 4))

    # B10 — Løn, overenskomst og uddannelse
    min_wage_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))           # % over mindsteløn
    gender_pay_gap_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))     # lønforskel %
    collective_bargaining_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    training_hours_total: Mapped[float | None] = mapped_column(Numeric(10, 1))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    submission: Mapped[DataSubmission] = relationship("DataSubmission", back_populates="workforce_data")


class VSMEEnvironmentData(Base):
    """VSME B4 (Forurening), B5 (Biodiversitet), B6 (Vand), B7 (Ressourcer og affald)."""
    __tablename__ = "vsme_environment_data"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("data_submissions.id", ondelete="CASCADE"), nullable=False)

    # B4 — Forurening (kun hvis lovpligtigt eller frivillig EMS-rapportering)
    has_pollution_reporting: Mapped[bool] = mapped_column(Boolean, default=False)
    pollution_notes: Mapped[str | None] = mapped_column(Text)

    # B5 — Biodiversitet
    biodiversity_sensitive_sites: Mapped[int | None] = mapped_column(Integer, default=0)

    # B6 — Vand
    water_withdrawal_m3: Mapped[float | None] = mapped_column(Numeric(15, 2))
    water_stressed_m3: Mapped[float | None] = mapped_column(Numeric(15, 2))

    # B7 — Ressourceforbrug og affald
    waste_total_tonnes: Mapped[float | None] = mapped_column(Numeric(15, 3))
    waste_recycled_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    waste_hazardous_tonnes: Mapped[float | None] = mapped_column(Numeric(15, 3))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    submission: Mapped[DataSubmission] = relationship("DataSubmission", back_populates="environment_data")
