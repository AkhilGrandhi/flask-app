"""add subscription start date

Revision ID: b1c2d3e4f5a6
Revises: a1b2c3d4e5f6
Create Date: 2025-01-15 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "b1c2d3e4f5a6"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # --- Candidate: add subscription_start_date column ---
    if "candidate" in inspector.get_table_names():
        candidate_columns = {col["name"] for col in inspector.get_columns("candidate")}
        if "subscription_start_date" not in candidate_columns:
            op.add_column("candidate", sa.Column("subscription_start_date", sa.Date(), nullable=True))


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # --- Candidate: drop subscription_start_date column ---
    if "candidate" in inspector.get_table_names():
        candidate_columns = {col["name"] for col in inspector.get_columns("candidate")}
        if "subscription_start_date" in candidate_columns:
            op.drop_column("candidate", "subscription_start_date")

