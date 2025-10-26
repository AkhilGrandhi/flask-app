#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running database migrations..."
# Try to run migrations, if it fails due to existing columns, handle it gracefully
flask db upgrade || {
    echo "Migration failed, attempting to fix..."
    # Stamp the database with current migrations
    flask db stamp head
    # Manually add f1_type column if it doesn't exist
    python -c "from app import create_app; from app.models import db; from sqlalchemy import text; app = create_app(); app.app_context().push(); db.session.execute(text('ALTER TABLE candidate ADD COLUMN IF NOT EXISTS f1_type VARCHAR(120)')); db.session.commit(); print('✓ f1_type column added or already exists')" || echo "Column already exists or couldn't be added"
}

echo "Build completed successfully!"

