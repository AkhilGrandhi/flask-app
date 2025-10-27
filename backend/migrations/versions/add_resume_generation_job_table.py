"""add resume generation job table

Revision ID: f9a8b7c6d5e4
Revises: 85fc35d7805b
Create Date: 2025-10-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f9a8b7c6d5e4'
down_revision = '85fc35d7805b'
branch_labels = None
depends_on = None


def upgrade():
    # Create resume_generation_job table
    op.create_table(
        'resume_generation_job',
        sa.Column('id', sa.String(length=255), nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=False),
        sa.Column('job_row_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('progress', sa.Integer(), nullable=True),
        sa.Column('file_type', sa.String(length=20), nullable=True),
        sa.Column('result_url', sa.String(length=512), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidate.id'], ),
        sa.ForeignKeyConstraint(['job_row_id'], ['candidate_job.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(
        op.f('ix_resume_generation_job_candidate_id'),
        'resume_generation_job',
        ['candidate_id'],
        unique=False
    )
    op.create_index(
        op.f('ix_resume_generation_job_job_row_id'),
        'resume_generation_job',
        ['job_row_id'],
        unique=False
    )
    op.create_index(
        op.f('ix_resume_generation_job_status'),
        'resume_generation_job',
        ['status'],
        unique=False
    )
    op.create_index(
        op.f('ix_resume_generation_job_created_at'),
        'resume_generation_job',
        ['created_at'],
        unique=False
    )


def downgrade():
    # Drop indexes
    op.drop_index(
        op.f('ix_resume_generation_job_created_at'),
        table_name='resume_generation_job'
    )
    op.drop_index(
        op.f('ix_resume_generation_job_status'),
        table_name='resume_generation_job'
    )
    op.drop_index(
        op.f('ix_resume_generation_job_job_row_id'),
        table_name='resume_generation_job'
    )
    op.drop_index(
        op.f('ix_resume_generation_job_candidate_id'),
        table_name='resume_generation_job'
    )
    
    # Drop table
    op.drop_table('resume_generation_job')

