"""Add VSME workforce and environment tables (B4-B10)

Revision ID: 003_vsme_workforce_env
Revises: 002_add_subscriptions_and_email_verify
Create Date: 2026-02-25
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "003_vsme_workforce_env"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── VSME Workforce Data (B8-B10) ──────────────────────────────────────
    op.create_table(
        "vsme_workforce_data",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("submission_id", UUID(as_uuid=True), sa.ForeignKey("data_submissions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("employees_total", sa.Integer, nullable=True),
        sa.Column("employees_male", sa.Integer, nullable=True),
        sa.Column("employees_female", sa.Integer, nullable=True),
        sa.Column("employees_permanent", sa.Integer, nullable=True),
        sa.Column("employees_temporary", sa.Integer, nullable=True),
        sa.Column("employees_full_time", sa.Integer, nullable=True),
        sa.Column("employees_part_time", sa.Integer, nullable=True),
        sa.Column("accident_count", sa.Integer, nullable=True, server_default="0"),
        sa.Column("fatalities", sa.Integer, nullable=True, server_default="0"),
        sa.Column("lost_time_injury_rate", sa.Numeric(8, 4), nullable=True),
        sa.Column("min_wage_pct", sa.Numeric(5, 2), nullable=True),
        sa.Column("gender_pay_gap_pct", sa.Numeric(5, 2), nullable=True),
        sa.Column("collective_bargaining_pct", sa.Numeric(5, 2), nullable=True),
        sa.Column("training_hours_total", sa.Numeric(10, 1), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── VSME Environment Data (B4-B7) ─────────────────────────────────────
    op.create_table(
        "vsme_environment_data",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("submission_id", UUID(as_uuid=True), sa.ForeignKey("data_submissions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("has_pollution_reporting", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("pollution_notes", sa.Text, nullable=True),
        sa.Column("biodiversity_sensitive_sites", sa.Integer, nullable=True, server_default="0"),
        sa.Column("water_withdrawal_m3", sa.Numeric(15, 2), nullable=True),
        sa.Column("water_stressed_m3", sa.Numeric(15, 2), nullable=True),
        sa.Column("waste_total_tonnes", sa.Numeric(15, 3), nullable=True),
        sa.Column("waste_recycled_pct", sa.Numeric(5, 2), nullable=True),
        sa.Column("waste_hazardous_tonnes", sa.Numeric(15, 3), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("vsme_environment_data")
    op.drop_table("vsme_workforce_data")
