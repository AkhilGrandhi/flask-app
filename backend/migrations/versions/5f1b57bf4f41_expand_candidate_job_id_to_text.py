"""Expand candidate job_id to Text

Revision ID: 5f1b57bf4f41
Revises: 3d458dca63f0
Create Date: 2025-10-31 19:25:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "5f1b57bf4f41"
down_revision = "3d458dca63f0"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "candidate_job",
        "job_id",
        existing_type=sa.String(length=120),
        type_=sa.Text(),
        existing_nullable=False,
    )


def downgrade():
    op.alter_column(
        "candidate_job",
        "job_id",
        existing_type=sa.Text(),
        type_=sa.String(length=120),
        existing_nullable=False,
    )

