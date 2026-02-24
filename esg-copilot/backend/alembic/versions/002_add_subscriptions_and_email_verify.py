"""Add subscription fields and email verification to users table

Revision ID: 002
Revises: 001
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('email_verify_token', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('subscription_plan', sa.String(50), nullable=False, server_default='free'))
    op.add_column('users', sa.Column('subscription_status', sa.String(50), nullable=False, server_default='inactive'))
    op.add_column('users', sa.Column('subscription_expires_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'email_verify_token')
    op.drop_column('users', 'stripe_customer_id')
    op.drop_column('users', 'subscription_plan')
    op.drop_column('users', 'subscription_status')
    op.drop_column('users', 'subscription_expires_at')
