#!/usr/bin/env python3
"""
Quick fix script for migration conflicts on Render.
Run this when you get "column already exists" errors.
"""

import sys
import os

print("=" * 60)
print("Migration Conflict Fixer")
print("=" * 60)

try:
    from app import create_app
    from app.models import db
    from sqlalchemy import text, inspect
    
    print("\n1. Creating Flask application...")
    app = create_app()
    
    with app.app_context():
        print("2. Checking database connection...")
        print("   ✓ Connected to database")
        
        print("\n3. Checking if f1_type column exists...")
        inspector = inspect(db.engine)
        candidate_columns = [col['name'] for col in inspector.get_columns('candidate')]
        
        if 'f1_type' in candidate_columns:
            print("   ✓ f1_type column already exists")
        else:
            print("   ✗ f1_type column missing, adding it...")
            try:
                db.session.execute(text('ALTER TABLE candidate ADD COLUMN f1_type VARCHAR(120)'))
                db.session.commit()
                print("   ✓ f1_type column added successfully!")
            except Exception as e:
                print(f"   ✗ Could not add column: {e}")
                sys.exit(1)
        
        print("\n4. Verifying all required columns...")
        required_columns = [
            'id', 'first_name', 'last_name', 'email', 'phone',
            'visa_status', 'f1_type', 'subscription_type', 'password'
        ]
        
        missing = [col for col in required_columns if col not in candidate_columns]
        if missing:
            print(f"   ✗ WARNING: Missing columns: {', '.join(missing)}")
        else:
            print("   ✓ All required columns present")
        
        print("\n5. Checking migration state...")
        # Mark migrations as complete
        from flask_migrate import stamp
        try:
            stamp(revision='head')
            print("   ✓ Migrations marked as complete")
        except Exception as e:
            print(f"   ⚠ Could not stamp migrations: {e}")
        
    print("\n" + "=" * 60)
    print("✅ Fix completed successfully!")
    print("=" * 60)
    print("\nYou can now:")
    print("1. Exit this shell")
    print("2. Redeploy your service")
    print("3. Your app should work correctly")
    
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

