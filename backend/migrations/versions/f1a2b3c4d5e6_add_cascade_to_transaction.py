"""add cascade delete to transaction table foreign key

Revision ID: f1a2b3c4d5e6
Revises: e1f2a3b4c5d6
Create Date: 2025-01-15 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f1a2b3c4d5e6"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Only apply if transaction table exists
    if "transaction" in inspector.get_table_names():
        # Get the actual constraint name from the database
        fks = inspector.get_foreign_keys('transaction')
        constraint_name = None
        for fk in fks:
            if 'candidate_id' in fk['constrained_columns']:
                constraint_name = fk['name']
                break
        
        if constraint_name:
            # Drop the existing foreign key constraint
            op.drop_constraint(constraint_name, 'transaction', type_='foreignkey')
            # Re-add it with CASCADE delete
            op.create_foreign_key(constraint_name, 'transaction', 'candidate', ['candidate_id'], ['id'], ondelete='CASCADE')


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # Only apply if transaction table exists
    if "transaction" in inspector.get_table_names():
        # Get the actual constraint name from the database
        fks = inspector.get_foreign_keys('transaction')
        constraint_name = None
        for fk in fks:
            if 'candidate_id' in fk['constrained_columns']:
                constraint_name = fk['name']
                break
        
        if constraint_name:
            # Drop the CASCADE foreign key constraint
            op.drop_constraint(constraint_name, 'transaction', type_='foreignkey')
            # Re-add it without CASCADE delete (for backward compatibility)
            op.create_foreign_key(constraint_name, 'transaction', 'candidate', ['candidate_id'], ['id'])

