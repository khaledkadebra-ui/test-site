"""006_snapshots_and_credits

Add esg_snapshots table for historical tracking +
one_time_report_credits column on users.

Revision ID: 006
Revises: 005
Create Date: 2026-03-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade():
    # ── one_time_report_credits on users ────────────────────────────────────
    op.add_column(
        "users",
        sa.Column("one_time_report_credits", sa.Integer(), nullable=False, server_default="0"),
    )

    # ── esg_snapshots ────────────────────────────────────────────────────────
    op.create_table(
        "esg_snapshots",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("company_id", UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("report_id", UUID(as_uuid=True), sa.ForeignKey("reports.id", ondelete="SET NULL"), nullable=True),
        sa.Column("snapshot_month", sa.Integer(), nullable=False),  # 1-12
        sa.Column("snapshot_year", sa.Integer(), nullable=False),
        sa.Column("reporting_year", sa.Integer(), nullable=True),  # fiscal year of the data
        # ESG scores
        sa.Column("esg_score_total", sa.Numeric(5, 2), nullable=True),
        sa.Column("esg_score_e", sa.Numeric(5, 2), nullable=True),
        sa.Column("esg_score_s", sa.Numeric(5, 2), nullable=True),
        sa.Column("esg_score_g", sa.Numeric(5, 2), nullable=True),
        sa.Column("esg_rating", sa.String(1), nullable=True),
        sa.Column("industry_percentile", sa.Numeric(5, 2), nullable=True),
        # CO2
        sa.Column("total_co2e_tonnes", sa.Numeric(12, 3), nullable=True),
        sa.Column("scope1_co2e_tonnes", sa.Numeric(12, 3), nullable=True),
        sa.Column("scope2_co2e_tonnes", sa.Numeric(12, 3), nullable=True),
        sa.Column("scope3_co2e_tonnes", sa.Numeric(12, 3), nullable=True),
        # Extra context
        sa.Column("employee_count", sa.Integer(), nullable=True),
        sa.Column("industry_code", sa.String(100), nullable=True),
        sa.Column("extra_data", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        # Unique per company per month+year
        sa.UniqueConstraint("company_id", "snapshot_month", "snapshot_year", name="uq_company_snapshot_month"),
    )

    op.create_index("ix_esg_snapshots_company_year", "esg_snapshots", ["company_id", "snapshot_year"])


def downgrade():
    op.drop_index("ix_esg_snapshots_company_year", table_name="esg_snapshots")
    op.drop_table("esg_snapshots")
    op.drop_column("users", "one_time_report_credits")
