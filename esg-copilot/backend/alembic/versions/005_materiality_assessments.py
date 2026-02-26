"""Add materiality_assessments table

Revision ID: 005_materiality_assessments
Revises: 004_improvements_narrative
Create Date: 2026-02-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "005_materiality_assessments"
down_revision = "004_improvements_narrative"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "materiality_assessments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("company_id", UUID(as_uuid=True), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assessed_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("industry_code", sa.String(50), nullable=True),
        sa.Column("employee_count", sa.Integer, nullable=True),
        sa.Column("revenue_eur", sa.Numeric(20, 2), nullable=True),
        sa.Column("country_code", sa.String(2), nullable=True),
        sa.Column("assessment", JSONB, nullable=True),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("prompt_version", sa.String(20), nullable=False, server_default="1.0"),
    )
    op.create_index("ix_materiality_company_id", "materiality_assessments", ["company_id"])


def downgrade() -> None:
    op.drop_index("ix_materiality_company_id", table_name="materiality_assessments")
    op.drop_table("materiality_assessments")
