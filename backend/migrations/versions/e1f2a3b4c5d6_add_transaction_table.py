"""add transaction table

Revision ID: e1f2a3b4c5d6
Revises: d1e2f3a4b5c6
Create Date: 2025-01-15 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e1f2a3b4c5d6"
down_revision = "d1e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # --- Create transaction table ---
    if "transaction" not in inspector.get_table_names():
        op.create_table(
            'transaction',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('candidate_id', sa.Integer(), nullable=False),
            sa.Column('transaction_id', sa.String(length=255), nullable=False),
            sa.Column('original_transaction', sa.String(length=255), nullable=True),
            sa.Column('start_date', sa.Date(), nullable=False),
            sa.Column('end_date', sa.Date(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ondelete='CASCADE', name='fk_transaction_candidate'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('transaction_id')
        )
        op.create_index('ix_transaction_candidate_id', 'transaction', ['candidate_id'], unique=False)
        op.create_index('ix_transaction_transaction_id', 'transaction', ['transaction_id'], unique=True)


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # --- Drop transaction table ---
    if "transaction" in inspector.get_table_names():
        op.drop_index('ix_transaction_transaction_id', table_name='transaction')
        op.drop_index('ix_transaction_candidate_id', table_name='transaction')
        op.drop_table('transaction')

