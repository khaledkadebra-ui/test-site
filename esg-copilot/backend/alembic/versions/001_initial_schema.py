"""Initial schema — all tables

Revision ID: 001
Revises:
Create Date: 2026-02-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── extensions ────────────────────────────────────────────────────────────
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    # ── companies ─────────────────────────────────────────────────────────────
    op.create_table(
        "companies",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("name", sa.String(500), nullable=False),
        sa.Column("registration_number", sa.String(100)),
        sa.Column("industry_code", sa.String(50), nullable=False),
        sa.Column("nace_code", sa.String(10)),
        sa.Column("country_code", sa.String(2), nullable=False),
        sa.Column("city", sa.String(255)),
        sa.Column("employee_count", sa.Integer()),
        sa.Column("revenue_eur", sa.Numeric(20, 2)),
        sa.Column("fiscal_year_end", sa.String(5)),
        sa.Column("created_by", postgresql.UUID(as_uuid=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("role", sa.String(50), nullable=False, server_default="company_admin"),
        sa.Column("company_id", postgresql.UUID(as_uuid=True)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_users_company", "users", ["company_id"])

    # companies.created_by FK (after users)
    op.create_foreign_key("fk_companies_created_by", "companies", "users", ["created_by"], ["id"], ondelete="SET NULL")

    # ── data_submissions ──────────────────────────────────────────────────────
    op.create_table(
        "data_submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reporting_year", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="incomplete"),
        sa.Column("submitted_by", postgresql.UUID(as_uuid=True)),
        sa.Column("submitted_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["submitted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "reporting_year"),
    )
    op.create_index("idx_submissions_company", "data_submissions", ["company_id"])
    op.create_index("idx_submissions_year", "data_submissions", ["reporting_year"])

    # ── energy_data ───────────────────────────────────────────────────────────
    op.create_table(
        "energy_data",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("natural_gas_m3", sa.Numeric(15, 2), server_default="0"),
        sa.Column("diesel_liters", sa.Numeric(15, 2), server_default="0"),
        sa.Column("petrol_liters", sa.Numeric(15, 2), server_default="0"),
        sa.Column("lpg_liters", sa.Numeric(15, 2), server_default="0"),
        sa.Column("heating_oil_liters", sa.Numeric(15, 2), server_default="0"),
        sa.Column("coal_kg", sa.Numeric(15, 2), server_default="0"),
        sa.Column("company_car_km", sa.Numeric(15, 2), server_default="0"),
        sa.Column("company_van_km", sa.Numeric(15, 2), server_default="0"),
        sa.Column("company_truck_km", sa.Numeric(15, 2), server_default="0"),
        sa.Column("electricity_kwh", sa.Numeric(15, 2), server_default="0"),
        sa.Column("district_heating_kwh", sa.Numeric(15, 2), server_default="0"),
        sa.Column("renewable_electricity_pct", sa.Numeric(5, 2), server_default="0"),
        sa.Column("source_document_url", sa.Text()),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["data_submissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── travel_data ───────────────────────────────────────────────────────────
    op.create_table(
        "travel_data",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("air_short_haul_km", sa.Numeric(15, 2), server_default="0"),
        sa.Column("air_long_haul_km", sa.Numeric(15, 2), server_default="0"),
        sa.Column("air_business_class_pct", sa.Numeric(5, 2), server_default="0"),
        sa.Column("rail_km", sa.Numeric(15, 2), server_default="0"),
        sa.Column("rental_car_km", sa.Numeric(15, 2), server_default="0"),
        sa.Column("taxi_km", sa.Numeric(15, 2), server_default="0"),
        sa.Column("avg_commute_km_one_way", sa.Numeric(8, 2), server_default="0"),
        sa.Column("commute_days_per_year", sa.Integer(), server_default="220"),
        sa.Column("commute_mode_car_pct", sa.Numeric(5, 2), server_default="60"),
        sa.Column("commute_mode_transit_pct", sa.Numeric(5, 2), server_default="25"),
        sa.Column("commute_mode_active_pct", sa.Numeric(5, 2), server_default="15"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["data_submissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── procurement_data ──────────────────────────────────────────────────────
    op.create_table(
        "procurement_data",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("purchased_goods_spend_eur", sa.Numeric(20, 2), server_default="0"),
        sa.Column("supplier_count", sa.Integer()),
        sa.Column("has_supplier_code_of_conduct", sa.Boolean(), server_default="false"),
        sa.Column("top_spend_category", sa.String(50)),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["data_submissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── esg_policy_data ───────────────────────────────────────────────────────
    op.create_table(
        "esg_policy_data",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("has_energy_reduction_target", sa.Boolean(), server_default="false"),
        sa.Column("has_net_zero_target", sa.Boolean(), server_default="false"),
        sa.Column("net_zero_target_year", sa.Integer()),
        sa.Column("waste_recycled_pct", sa.Numeric(5, 2)),
        sa.Column("has_waste_policy", sa.Boolean(), server_default="false"),
        sa.Column("has_water_policy", sa.Boolean(), server_default="false"),
        sa.Column("has_health_safety_policy", sa.Boolean(), server_default="false"),
        sa.Column("lost_time_injury_rate", sa.Numeric(8, 4)),
        sa.Column("has_training_program", sa.Boolean(), server_default="false"),
        sa.Column("avg_training_hours_per_employee", sa.Numeric(8, 2)),
        sa.Column("has_diversity_policy", sa.Boolean(), server_default="false"),
        sa.Column("female_management_pct", sa.Numeric(5, 2)),
        sa.Column("living_wage_commitment", sa.Boolean(), server_default="false"),
        sa.Column("has_esg_policy", sa.Boolean(), server_default="false"),
        sa.Column("has_code_of_conduct", sa.Boolean(), server_default="false"),
        sa.Column("has_anti_corruption_policy", sa.Boolean(), server_default="false"),
        sa.Column("has_data_privacy_policy", sa.Boolean(), server_default="false"),
        sa.Column("has_board_esg_oversight", sa.Boolean(), server_default="false"),
        sa.Column("esg_reporting_year", sa.Integer()),
        sa.Column("supply_chain_code_of_conduct", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["data_submissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── reports ───────────────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(50), nullable=False, server_default="draft"),
        sa.Column("pdf_url", sa.Text()),
        sa.Column("created_by", postgresql.UUID(as_uuid=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("error_message", sa.Text()),
        sa.Column("disclaimer", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["submission_id"], ["data_submissions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_reports_company", "reports", ["company_id"])
    op.create_index("idx_reports_status", "reports", ["status"])
    op.create_index("idx_reports_submission", "reports", ["submission_id"])

    # ── report_results ────────────────────────────────────────────────────────
    op.create_table(
        "report_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scope1_co2e_kg", sa.Numeric(20, 4)),
        sa.Column("scope2_co2e_kg", sa.Numeric(20, 4)),
        sa.Column("scope3_co2e_kg", sa.Numeric(20, 4)),
        sa.Column("total_co2e_kg", sa.Numeric(20, 4)),
        sa.Column("scope1_breakdown", postgresql.JSONB()),
        sa.Column("scope2_breakdown", postgresql.JSONB()),
        sa.Column("scope3_breakdown", postgresql.JSONB()),
        sa.Column("esg_score_total", sa.Numeric(5, 2)),
        sa.Column("esg_score_e", sa.Numeric(5, 2)),
        sa.Column("esg_score_s", sa.Numeric(5, 2)),
        sa.Column("esg_score_g", sa.Numeric(5, 2)),
        sa.Column("esg_rating", sa.String(1)),
        sa.Column("industry_percentile", sa.Numeric(5, 2)),
        sa.Column("e_breakdown", postgresql.JSONB()),
        sa.Column("s_breakdown", postgresql.JSONB()),
        sa.Column("g_breakdown", postgresql.JSONB()),
        sa.Column("identified_gaps", postgresql.JSONB()),
        sa.Column("recommendations", postgresql.JSONB()),
        sa.Column("executive_summary", sa.Text()),
        sa.Column("co2_narrative", sa.Text()),
        sa.Column("esg_narrative", sa.Text()),
        sa.Column("roadmap_narrative", sa.Text()),
        sa.Column("calculation_engine_version", sa.String(20), nullable=False, server_default="1.0.0"),
        sa.Column("ai_model_used", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── audit_logs ────────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True)),
        sa.Column("company_id", postgresql.UUID(as_uuid=True)),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(50)),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True)),
        sa.Column("old_value", postgresql.JSONB()),
        sa.Column("new_value", postgresql.JSONB()),
        sa.Column("ip_address", sa.String(45)),
        sa.Column("user_agent", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_audit_user", "audit_logs", ["user_id"])
    op.create_index("idx_audit_company", "audit_logs", ["company_id"])
    op.create_index("idx_audit_created", "audit_logs", ["created_at"])
    op.create_index("idx_audit_entity", "audit_logs", ["entity_type", "entity_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("report_results")
    op.drop_table("reports")
    op.drop_table("esg_policy_data")
    op.drop_table("procurement_data")
    op.drop_table("travel_data")
    op.drop_table("energy_data")
    op.drop_table("data_submissions")
    op.drop_table("users")
    op.drop_table("companies")
