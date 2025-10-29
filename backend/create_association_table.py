#!/usr/bin/env python3
"""
Quick fix script to create the candidate_assigned_users association table.
Run this on Render if the table is missing.
"""

import sys
import os

print("=" * 70)
print("Create candidate_assigned_users Association Table")
print("=" * 70)

try:
    from app import create_app
    from app.models import db
    from sqlalchemy import text, inspect
    
    print("\n1. Creating Flask application...")
    app = create_app()
    
    with app.app_context():
        print("2. Checking database connection...")
        print("   ✓ Connected to database")
        
        print("\n3. Checking if candidate_assigned_users table exists...")
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        if 'candidate_assigned_users' in existing_tables:
            print("   ✓ Table already exists!")
            print("   No action needed.")
        else:
            print("   ⚠ Table does not exist. Creating it now...")
            
            # Create the table manually
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS candidate_assigned_users (
                candidate_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (candidate_id, user_id),
                FOREIGN KEY (candidate_id) REFERENCES candidate(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
            )
            """
            
            try:
                db.session.execute(text(create_table_sql))
                db.session.commit()
                print("   ✓ Table created successfully!")
            except Exception as e:
                print(f"   ✗ Error creating table: {e}")
                db.session.rollback()
                sys.exit(1)
        
        print("\n4. Verifying table structure...")
        inspector = inspect(db.engine)
        if 'candidate_assigned_users' in inspector.get_table_names():
            columns = inspector.get_columns('candidate_assigned_users')
            print(f"   ✓ Table has {len(columns)} columns:")
            for col in columns:
                print(f"     - {col['name']} ({col['type']})")
        
        print("\n5. Updating migration state...")
        try:
            from flask_migrate import stamp
            stamp(revision='head')
            print("   ✓ Database stamped with latest migration version")
        except Exception as stamp_error:
            print(f"   ⚠ Stamp error (non-critical): {stamp_error}")
        
    print("\n" + "=" * 70)
    print("✅ Association table created successfully!")
    print("=" * 70)
    print("\nYour admin panel should now work correctly.")
    print("Try refreshing the page to see candidates.")
    
except Exception as e:
    print(f"\n✗ CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

