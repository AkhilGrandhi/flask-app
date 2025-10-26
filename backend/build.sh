#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running database migrations..."
flask db upgrade

echo "Build completed successfully!"

