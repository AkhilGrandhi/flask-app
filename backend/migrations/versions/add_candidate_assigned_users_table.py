"""add candidate_assigned_users association table

Revision ID: candidate_assigned_001
Revises: f9a8b7c6d5e4
Create Date: 2025-01-29 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'candidate_assigned_001'
down_revision = 'f9a8b7c6d5e4'
branch_labels = None
depends_on = None


def upgrade():
    # Create the candidate_assigned_users association table
    op.create_table('candidate_assigned_users',
        sa.Column('candidate_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('assigned_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('candidate_id', 'user_id')
    )


def downgrade():
    # Drop the candidate_assigned_users association table
    op.drop_table('candidate_assigned_users')

