"""add renewal date column

Revision ID: d1e2f3a4b5c6
Revises: b1c2d3e4f5a6
Create Date: 2025-01-15 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d1e2f3a4b5c6"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # --- Subscription: add renewal_date column ---
    if "subscription" in inspector.get_table_names():
        subscription_columns = {col["name"] for col in inspector.get_columns("subscription")}
        if "renewal_date" not in subscription_columns:
            op.add_column("subscription", sa.Column("renewal_date", sa.DateTime(), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # --- Subscription: drop renewal_date column ---
    if "subscription" in inspector.get_table_names():
        subscription_columns = {col["name"] for col in inspector.get_columns("subscription")}
        if "renewal_date" in subscription_columns:
            op.drop_column("subscription", "renewal_date")

