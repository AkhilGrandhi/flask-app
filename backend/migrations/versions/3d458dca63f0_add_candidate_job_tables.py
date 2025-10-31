"""Add candidate job and resume tracking tables

Revision ID: 3d458dca63f0
Revises: 04161cd1902f
Create Date: 2025-10-31 18:45:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "3d458dca63f0"
down_revision = "04161cd1902f"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if "candidate_job" not in existing_tables:
        op.create_table(
            "candidate_job",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidate.id"), nullable=False),
            sa.Column("job_id", sa.String(length=120), nullable=False),
            sa.Column("job_description", sa.Text(), nullable=False),
            sa.Column("resume_content", sa.Text(), nullable=True),
            sa.Column("docx_path", sa.String(length=512), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("ix_candidate_job_candidate_id", "candidate_job", ["candidate_id"])
        op.create_index("ix_candidate_job_created_at", "candidate_job", ["created_at"])

    if "resume_generation_job" not in existing_tables:
        op.create_table(
            "resume_generation_job",
            sa.Column("id", sa.String(length=255), primary_key=True),
            sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidate.id"), nullable=False),
            sa.Column("job_row_id", sa.Integer(), sa.ForeignKey("candidate_job.id"), nullable=True),
            sa.Column("status", sa.String(length=50), server_default="PENDING", nullable=False),
            sa.Column("progress", sa.Integer(), server_default="0", nullable=False),
            sa.Column("file_type", sa.String(length=20), server_default="word", nullable=False),
            sa.Column("result_url", sa.String(length=512), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("started_at", sa.DateTime(), nullable=True),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_resume_generation_job_candidate_id", "resume_generation_job", ["candidate_id"])
        op.create_index("ix_resume_generation_job_job_row_id", "resume_generation_job", ["job_row_id"])
        op.create_index("ix_resume_generation_job_status", "resume_generation_job", ["status"])
        op.create_index("ix_resume_generation_job_created_at", "resume_generation_job", ["created_at"])

    if "candidate_assigned_users" not in existing_tables:
        op.create_table(
            "candidate_assigned_users",
            sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidate.id"), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), primary_key=True),
            sa.Column("assigned_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if "candidate_assigned_users" in existing_tables:
        op.drop_table("candidate_assigned_users")

    if "resume_generation_job" in existing_tables:
        op.drop_index("ix_resume_generation_job_created_at", table_name="resume_generation_job")
        op.drop_index("ix_resume_generation_job_status", table_name="resume_generation_job")
        op.drop_index("ix_resume_generation_job_job_row_id", table_name="resume_generation_job")
        op.drop_index("ix_resume_generation_job_candidate_id", table_name="resume_generation_job")
        op.drop_table("resume_generation_job")

    if "candidate_job" in existing_tables:
        op.drop_index("ix_candidate_job_created_at", table_name="candidate_job")
        op.drop_index("ix_candidate_job_candidate_id", table_name="candidate_job")
        op.drop_table("candidate_job")

