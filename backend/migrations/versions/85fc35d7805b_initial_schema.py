"""initial schema

Revision ID: 85fc35d7805b
Revises: None
Create Date: 2025-10-25 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "85fc35d7805b"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = {t.lower() for t in inspector.get_table_names()}

    # --- user table ----------------------------------------------------
    if "user" not in existing_tables:
        op.create_table(
            "user",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=120), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("mobile", sa.String(length=30), nullable=False),
            sa.Column("password_hash", sa.String(length=255), nullable=False),
            sa.Column(
                "role",
                sa.String(length=20),
                nullable=False,
                server_default="user",
            ),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.UniqueConstraint("email", name="uq_user_email"),
            sa.UniqueConstraint("mobile", name="uq_user_mobile"),
        )

    # --- candidate table -----------------------------------------------
    if "candidate" not in existing_tables:
        op.create_table(
            "candidate",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("created_by_user_id", sa.Integer(), nullable=False),
            sa.Column("first_name", sa.String(length=120), nullable=False),
            sa.Column("last_name", sa.String(length=120), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=True),
            sa.Column("phone", sa.String(length=50), nullable=True),
            sa.Column("subscription_type", sa.String(length=50), nullable=True),
            sa.Column("password", sa.String(length=255), nullable=True),
            sa.Column("ssn", sa.String(length=10), nullable=True),
            sa.Column("birthdate", sa.Date(), nullable=True),
            sa.Column("gender", sa.String(length=50), nullable=True),
            sa.Column("nationality", sa.String(length=120), nullable=True),
            sa.Column("citizenship_status", sa.String(length=120), nullable=True),
            sa.Column("visa_status", sa.String(length=120), nullable=True),
            sa.Column("f1_type", sa.String(length=120), nullable=True),
            sa.Column("work_authorization", sa.String(length=120), nullable=True),
            sa.Column(
                "willing_relocate",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
            sa.Column(
                "willing_travel",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
            sa.Column(
                "disability_status",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
            sa.Column("veteran_status", sa.String(length=120), nullable=True),
            sa.Column(
                "military_experience",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
            sa.Column("race_ethnicity", sa.String(length=120), nullable=True),
            sa.Column("expected_wage", sa.String(length=120), nullable=True),
            sa.Column("contact_current_employer", sa.String(length=120), nullable=True),
            sa.Column("recent_degree", sa.String(length=255), nullable=True),
            sa.Column("authorized_work_us", sa.String(length=120), nullable=True),
            sa.Column("authorized_without_sponsorship", sa.String(length=120), nullable=True),
            sa.Column("referral_source", sa.String(length=255), nullable=True),
            sa.Column("at_least_18", sa.String(length=10), nullable=True),
            sa.Column("needs_visa_sponsorship", sa.String(length=120), nullable=True),
            sa.Column("family_in_org", sa.String(length=255), nullable=True),
            sa.Column("availability", sa.String(length=120), nullable=True),
            sa.Column("address_line1", sa.String(length=255), nullable=True),
            sa.Column("address_line2", sa.String(length=255), nullable=True),
            sa.Column("city", sa.String(length=120), nullable=True),
            sa.Column("state", sa.String(length=120), nullable=True),
            sa.Column("postal_code", sa.String(length=40), nullable=True),
            sa.Column("country", sa.String(length=120), nullable=True),
            sa.Column("personal_website", sa.String(length=255), nullable=True),
            sa.Column("linkedin", sa.String(length=255), nullable=True),
            sa.Column("github", sa.String(length=255), nullable=True),
            sa.Column("technical_skills", sa.Text(), nullable=True),
            sa.Column("work_experience", sa.Text(), nullable=True),
            sa.Column("education", sa.Text(), nullable=True),
            sa.Column("certificates", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.ForeignKeyConstraint(
                ["created_by_user_id"],
                ["user.id"],
                name="fk_candidate_user",
            ),
            sa.UniqueConstraint("ssn", name="uq_candidate_ssn"),
        )

    # --- candidate_job table -------------------------------------------
    if "candidate_job" not in existing_tables:
        op.create_table(
            "candidate_job",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("candidate_id", sa.Integer(), nullable=False),
            sa.Column("job_id", sa.String(length=120), nullable=False),
            sa.Column("job_description", sa.Text(), nullable=False),
            sa.Column("resume_content", sa.Text(), nullable=True),
            sa.Column("docx_path", sa.String(length=512), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.ForeignKeyConstraint(
                ["candidate_id"],
                ["candidate.id"],
                ondelete="CASCADE",
                name="fk_candidate_job_candidate",
            ),
        )
        op.create_index(
            "ix_candidate_job_candidate_id",
            "candidate_job",
            ["candidate_id"],
        )
        op.create_index(
            "ix_candidate_job_created_at",
            "candidate_job",
            ["created_at"],
        )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    indexes = {table: {idx["name"] for idx in inspector.get_indexes(table)} for table in inspector.get_table_names()}

    if "candidate_job" in indexes and "ix_candidate_job_created_at" in indexes["candidate_job"]:
        op.drop_index("ix_candidate_job_created_at", table_name="candidate_job")
    if "candidate_job" in indexes and "ix_candidate_job_candidate_id" in indexes["candidate_job"]:
        op.drop_index("ix_candidate_job_candidate_id", table_name="candidate_job")
    if "candidate_job" in {t.lower() for t in inspector.get_table_names()}:
        op.drop_table("candidate_job")

    if "candidate" in {t.lower() for t in inspector.get_table_names()}:
        op.drop_table("candidate")

    if "user" in {t.lower() for t in inspector.get_table_names()}:
        op.drop_table("user")

