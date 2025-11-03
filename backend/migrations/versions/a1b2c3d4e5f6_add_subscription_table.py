"""add subscription table

Revision ID: a1b2c3d4e5f6
Revises: f1f2c3d4e5f6
Create Date: 2025-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "f1f2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    table_names = set(inspector.get_table_names())

    # --- Create subscription table ---
    if "subscription" not in table_names:
        op.create_table(
            "subscription",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("candidate_id", sa.Integer(), nullable=False),
            sa.Column("tier", sa.String(length=50), nullable=False),
            sa.Column("status", sa.String(length=50), nullable=False, server_default="inactive"),
            sa.Column("billing_cycle", sa.String(length=20), server_default="monthly", nullable=False),
            sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=True),
            sa.Column("activated_at", sa.DateTime(), nullable=True),
            sa.Column("expires_at", sa.DateTime(), nullable=True),
            sa.Column("paused_at", sa.DateTime(), nullable=True),
            sa.Column("deactivated_at", sa.DateTime(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("payment_method", sa.String(length=100), server_default="manual", nullable=False),
            sa.Column("transaction_id", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["candidate_id"], ["candidate.id"], ondelete="CASCADE", name="fk_subscription_candidate"),
            sa.UniqueConstraint("candidate_id", name="uq_subscription_candidate_id"),
        )
        
        # Create indexes
        op.create_index("ix_subscription_candidate_id", "subscription", ["candidate_id"])
        op.create_index("ix_subscription_status", "subscription", ["status"])
        op.create_index("ix_subscription_expires_at", "subscription", ["expires_at"])


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # --- Drop subscription table ---
    if "subscription" in inspector.get_table_names():
        existing_indexes = {idx["name"] for idx in inspector.get_indexes("subscription")}
        
        if "ix_subscription_expires_at" in existing_indexes:
            op.drop_index("ix_subscription_expires_at", table_name="subscription")
        if "ix_subscription_status" in existing_indexes:
            op.drop_index("ix_subscription_status", table_name="subscription")
        if "ix_subscription_candidate_id" in existing_indexes:
            op.drop_index("ix_subscription_candidate_id", table_name="subscription")
            
        op.drop_table("subscription")

