#!/usr/bin/env bash
# exit on error
set -o errexit

echo "=========================================="
echo "Starting Build Process"
echo "=========================================="

echo "Step 1: Installing dependencies..."
pip install -r requirements.txt
echo "✓ Dependencies installed"

echo ""
echo "Step 2: Running database migrations..."
# Check if migrations directory exists
if [ -d "migrations" ]; then
    echo "✓ Migrations directory found"
    
    # Try to run migrations, but handle cases where schema might already exist
    echo "Attempting to upgrade database..."
    
    # Temporarily disable errexit to handle migration errors gracefully
    set +e
    flask db upgrade 2>&1 | tee /tmp/migration_output.log
    MIGRATION_EXIT_CODE=$?
    set -e
    
    if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
        echo "✓ Database migrations completed successfully"
    else
        # Check if it's a "column already exists" or "relation already exists" error
        if grep -q "already exists" /tmp/migration_output.log; then
            echo "⚠ Detected existing schema conflict - attempting to sync migration state..."
            
            # Run the Python fix script to sync the state
            python fix_migration_conflict.py
            
            echo "✓ Migration state synchronized"
        else
            # It's a different error, fail the build
            echo "✗ Migration failed with an unexpected error"
            cat /tmp/migration_output.log
            exit 1
        fi
    fi
else
    echo "⚠ No migrations directory found"
    echo "Creating initial migration..."
    flask db init
    flask db migrate -m "Initial migration"
    flask db upgrade
    echo "✓ Initial migration completed"
fi

echo ""
echo "=========================================="
echo "Build completed successfully!"
echo "=========================================="

