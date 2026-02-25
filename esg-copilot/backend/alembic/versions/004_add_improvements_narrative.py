"""Add improvements_narrative to report_results

Revision ID: 004_improvements_narrative
Revises: 003_vsme_workforce_env
Create Date: 2026-02-25
"""
from alembic import op
import sqlalchemy as sa

revision = "004_improvements_narrative"
down_revision = "003_vsme_workforce_env"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "report_results",
        sa.Column("improvements_narrative", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("report_results", "improvements_narrative")
