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
    
    # Run migrations
    flask db upgrade
    echo "✓ Database migrations completed successfully"
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

