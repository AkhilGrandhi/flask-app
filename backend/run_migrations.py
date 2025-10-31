#!/usr/bin/env python3
"""
Manual migration runner script for Render deployment.
Run this in the Render Shell to apply database migrations.
"""

import sys
import os

# Ensure we're in the backend directory
if os.path.basename(os.getcwd()) != 'backend':
    print("ERROR: This script must be run from the backend directory")
    sys.exit(1)

print("=" * 60)
print("Database Migration Runner")
print("=" * 60)

try:
    from app import create_app
    from app.models import db, User, Candidate
    from flask_migrate import upgrade
    
    print("\n1. Creating Flask application...")
    app = create_app()
    
    with app.app_context():
        print("2. Checking database connection...")
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        # Hide password in output
        if '@' in db_uri:
            display_uri = db_uri.split('@')[0].split(':')[0] + ':***@' + db_uri.split('@')[1]
        else:
            display_uri = db_uri[:30] + '...'
        print(f"   Connected to: {display_uri}")
        
        print("\n3. Running migrations...")
        print("   Executing: flask db upgrade")
        
        # Run migrations
        from flask.cli import ScriptInfo
        from flask_migrate import Migrate
        
        migrate = Migrate(app, db)
        
        # Try to run upgrade
        try:
            upgrade()
            print("   ✓ Migrations completed successfully!")
        except Exception as e:
            print(f"   ✗ Migration error: {e}")
            print("\n   Attempting to fix migration conflicts...")
            
            # Import and run the fix script logic
            try:
                import subprocess
                result = subprocess.run([sys.executable, 'fix_migration_conflict.py'], 
                                       capture_output=True, text=True, check=False)
                print(result.stdout)
                if result.returncode != 0:
                    print(result.stderr)
            except Exception as fix_error:
                print(f"   ⚠ Fix script error: {fix_error}")
            
            print("\n   Creating/updating tables...")
            db.create_all()
            print("   ✓ Tables created successfully!")
            
            # Stamp the database with the latest migration version
            try:
                from flask_migrate import stamp
                stamp(revision='head')
                print("   ✓ Database stamped with latest migration version")
            except Exception as stamp_error:
                print(f"   ⚠ Stamp error (non-critical): {stamp_error}")
        
        print("\n4. Verifying database schema...")
        
        # Check if tables exist
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        print(f"   Found {len(tables)} tables:")
        for table in tables:
            columns = inspector.get_columns(table)
            print(f"   - {table}: {len(columns)} columns")
            
            # Check for f1_type column in candidate table
            if table == 'candidate':
                column_names = [col['name'] for col in columns]
                if 'f1_type' in column_names:
                    print("     ✓ f1_type column exists")
                else:
                    print("     ✗ WARNING: f1_type column missing!")
        
        # Verify critical tables exist
        critical_tables = ['user', 'candidate', 'candidate_assigned_users']
        missing_tables = [t for t in critical_tables if t not in tables]
        if missing_tables:
            print(f"\n   ⚠ WARNING: Missing critical tables: {', '.join(missing_tables)}")
            print("   → Attempting to create missing tables now...")
            
            # Try to create the candidate_assigned_users table if missing
            if 'candidate_assigned_users' in missing_tables:
                try:
                    from sqlalchemy import text
                    print("   → Creating candidate_assigned_users table...")
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
                    db.session.execute(text(create_table_sql))
                    db.session.commit()
                    print("   ✓ candidate_assigned_users table created!")
                except Exception as create_error:
                    print(f"   ⚠ Could not create table: {create_error}")
            
            # Re-check
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            missing_tables = [t for t in critical_tables if t not in tables]
            if missing_tables:
                print(f"   ⚠ Still missing: {', '.join(missing_tables)}")
            else:
                print(f"   ✓ All critical tables now exist!")
        else:
            print(f"\n   ✓ All critical tables exist")
        
        print("\n5. Checking users...")
        user_count = User.query.count()
        print(f"   Total users: {user_count}")
        
        admin_users = User.query.filter_by(role='admin').all()
        print(f"   Admin users: {len(admin_users)}")
        for admin in admin_users:
            print(f"   - {admin.email}")
        
        print("\n6. Checking candidates...")
        candidate_count = Candidate.query.count()
        print(f"   Total candidates: {candidate_count}")
        
    print("\n" + "=" * 60)
    print("Migration completed successfully!")
    print("=" * 60)
    print("\nYou can now test your application.")
    
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

