"""add role and async resume support

Revision ID: f1f2c3d4e5f6
Revises: 85fc35d7805b
Create Date: 2025-10-31 22:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f1f2c3d4e5f6"
down_revision = "85fc35d7805b"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # --- Candidate: add role column ---
    candidate_columns = {col["name"] for col in inspector.get_columns("candidate")}
    if "role" not in candidate_columns:
        op.add_column("candidate", sa.Column("role", sa.String(length=255), nullable=True))

    # --- CandidateJob: widen job_id to Text and add helpful indexes ---
    if "candidate_job" in inspector.get_table_names():
        op.alter_column(
            "candidate_job",
            "job_id",
            existing_type=sa.String(length=120),
            type_=sa.Text(),
            existing_nullable=False,
        )

        existing_indexes = {idx["name"] for idx in inspector.get_indexes("candidate_job")}
        if "ix_candidate_job_candidate_id" not in existing_indexes:
            op.create_index(
                "ix_candidate_job_candidate_id",
                "candidate_job",
                ["candidate_id"],
            )
        if "ix_candidate_job_created_at" not in existing_indexes:
            op.create_index(
                "ix_candidate_job_created_at",
                "candidate_job",
                ["created_at"],
            )

    # --- Association table between candidates and assigned users ---
    table_names = set(inspector.get_table_names())
    if "candidate_assigned_users" not in table_names:
        op.create_table(
            "candidate_assigned_users",
            sa.Column(
                "candidate_id",
                sa.Integer(),
                sa.ForeignKey("candidate.id", ondelete="CASCADE"),
                primary_key=True,
            ),
            sa.Column(
                "user_id",
                sa.Integer(),
                sa.ForeignKey("user.id", ondelete="CASCADE"),
                primary_key=True,
            ),
            sa.Column(
                "assigned_at",
                sa.DateTime(),
                server_default=sa.text("now()"),
                nullable=False,
            ),
        )

    # --- Async resume generation tracking table ---
    if "resume_generation_job" not in table_names:
        op.create_table(
            "resume_generation_job",
            sa.Column("id", sa.String(length=255), primary_key=True),
            sa.Column(
                "candidate_id",
                sa.Integer(),
                sa.ForeignKey("candidate.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "job_row_id",
                sa.Integer(),
                sa.ForeignKey("candidate_job.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column(
                "status",
                sa.String(length=50),
                server_default="PENDING",
                nullable=False,
            ),
            sa.Column("progress", sa.Integer(), server_default="0", nullable=False),
            sa.Column("file_type", sa.String(length=20), server_default="word", nullable=False),
            sa.Column("result_url", sa.String(length=512), nullable=True),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(),
                server_default=sa.text("now()"),
                nullable=False,
            ),
            sa.Column("started_at", sa.DateTime(), nullable=True),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
        )
        op.create_index(
            "ix_resume_generation_job_candidate_id",
            "resume_generation_job",
            ["candidate_id"],
        )
        op.create_index(
            "ix_resume_generation_job_job_row_id",
            "resume_generation_job",
            ["job_row_id"],
        )
        op.create_index(
            "ix_resume_generation_job_status",
            "resume_generation_job",
            ["status"],
        )
        op.create_index(
            "ix_resume_generation_job_created_at",
            "resume_generation_job",
            ["created_at"],
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # --- Drop resume generation job indexes & table ---
    if "resume_generation_job" in inspector.get_table_names():
        existing_indexes = {idx["name"] for idx in inspector.get_indexes("resume_generation_job")}
        if "ix_resume_generation_job_created_at" in existing_indexes:
            op.drop_index("ix_resume_generation_job_created_at", table_name="resume_generation_job")
        if "ix_resume_generation_job_status" in existing_indexes:
            op.drop_index("ix_resume_generation_job_status", table_name="resume_generation_job")
        if "ix_resume_generation_job_job_row_id" in existing_indexes:
            op.drop_index("ix_resume_generation_job_job_row_id", table_name="resume_generation_job")
        if "ix_resume_generation_job_candidate_id" in existing_indexes:
            op.drop_index("ix_resume_generation_job_candidate_id", table_name="resume_generation_job")
        op.drop_table("resume_generation_job")

    # --- Drop association table ---
    if "candidate_assigned_users" in inspector.get_table_names():
        op.drop_table("candidate_assigned_users")

    # --- CandidateJob: shrink job_id back to VARCHAR(120) and drop indexes ---
    if "candidate_job" in inspector.get_table_names():
        existing_indexes = {idx["name"] for idx in inspector.get_indexes("candidate_job")}
        if "ix_candidate_job_created_at" in existing_indexes:
            op.drop_index("ix_candidate_job_created_at", table_name="candidate_job")
        if "ix_candidate_job_candidate_id" in existing_indexes:
            op.drop_index("ix_candidate_job_candidate_id", table_name="candidate_job")

        op.alter_column(
            "candidate_job",
            "job_id",
            existing_type=sa.Text(),
            type_=sa.String(length=120),
            existing_nullable=False,
        )

    # --- Candidate: drop role column ---
    candidate_columns = {col["name"] for col in inspector.get_columns("candidate")}
    if "role" in candidate_columns:
        op.drop_column("candidate", "role")


