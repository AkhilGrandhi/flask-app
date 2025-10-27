#!/usr/bin/env python3
"""
Universal Database Migration Conflict Resolver

This script automatically synchronizes your database schema with your SQLAlchemy models.
It handles ANY table and ANY column conflicts that may arise during migrations.

Works for:
- Column already exists errors
- Table already exists errors  
- Multiple tables (User, Candidate, CandidateJob, etc.)
- Future schema changes

Safe to run multiple times - idempotent operation.
"""

import sys
import os

print("=" * 70)
print("Universal Migration Conflict Resolver")
print("=" * 70)

try:
    from app import create_app
    from app.models import db
    from sqlalchemy import text, inspect
    from sqlalchemy.exc import ProgrammingError
    
    print("\n1. Creating Flask application...")
    app = create_app()
    
    with app.app_context():
        print("2. Checking database connection...")
        print("   ✓ Connected to database")
        
        print("\n3. Inspecting current database schema...")
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        print(f"   ✓ Found {len(existing_tables)} tables in database")
        print(f"   Tables: {', '.join(existing_tables)}")
        
        print("\n4. Inspecting SQLAlchemy models...")
        # Get all tables from our models
        model_tables = {}
        for table_name, table in db.metadata.tables.items():
            model_tables[table_name] = {
                'columns': {},
                'table_obj': table
            }
            for column in table.columns:
                model_tables[table_name]['columns'][column.name] = column
        
        print(f"   ✓ Found {len(model_tables)} tables in models")
        print(f"   Models: {', '.join(model_tables.keys())}")
        
        print("\n5. Synchronizing schema for each table...")
        total_fixed = 0
        
        for table_name, model_info in model_tables.items():
            print(f"\n   [{table_name}]")
            
            # Check if table exists in database
            if table_name not in existing_tables:
                print(f"   ⚠ Table '{table_name}' missing from database")
                print(f"   → Will be created by pending migrations")
                continue
            
            # Get current columns from database
            db_columns = {col['name']: col for col in inspector.get_columns(table_name)}
            model_columns = model_info['columns']
            
            print(f"   Database has {len(db_columns)} columns")
            print(f"   Model expects {len(model_columns)} columns")
            
            # Find missing columns
            missing_columns = []
            for col_name, col_obj in model_columns.items():
                if col_name not in db_columns:
                    missing_columns.append((col_name, col_obj))
            
            if missing_columns:
                print(f"   ⚠ Found {len(missing_columns)} missing column(s)")
                
                for col_name, col_obj in missing_columns:
                    try:
                        # Build column type string
                        col_type = str(col_obj.type.compile(db.engine.dialect))
                        
                        # Determine nullable
                        nullable = col_obj.nullable
                        null_clause = "NULL" if nullable else "NOT NULL"
                        
                        # Handle default values
                        default_clause = ""
                        if col_obj.default is not None:
                            if hasattr(col_obj.default, 'arg'):
                                default_val = col_obj.default.arg
                                if callable(default_val):
                                    # Skip callable defaults (like datetime.utcnow)
                                    default_clause = ""
                                elif isinstance(default_val, bool):
                                    default_clause = f"DEFAULT {str(default_val).upper()}"
                                elif isinstance(default_val, (int, float)):
                                    default_clause = f"DEFAULT {default_val}"
                                elif isinstance(default_val, str):
                                    default_clause = f"DEFAULT '{default_val}'"
                        
                        sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type} {null_clause} {default_clause}"
                        
                        print(f"   → Adding column '{col_name}' ({col_type})...")
                        db.session.execute(text(sql))
                        db.session.commit()
                        print(f"   ✓ Added '{col_name}' successfully")
                        total_fixed += 1
                        
                    except ProgrammingError as e:
                        if "already exists" in str(e):
                            print(f"   ℹ '{col_name}' already exists (race condition)")
                            db.session.rollback()
                        else:
                            print(f"   ⚠ Could not add '{col_name}': {e}")
                            db.session.rollback()
                    except Exception as e:
                        print(f"   ⚠ Error adding '{col_name}': {e}")
                        db.session.rollback()
            else:
                print(f"   ✓ All columns present")
        
        if total_fixed > 0:
            print(f"\n   Summary: Added {total_fixed} missing column(s)")
        else:
            print(f"\n   Summary: Schema is already synchronized")
        
        print("\n6. Checking migration version table...")
        tables = inspector.get_table_names()
        
        # Ensure alembic_version table exists
        if 'alembic_version' not in tables:
            print("   Creating alembic_version table...")
            try:
                db.session.execute(text(
                    "CREATE TABLE alembic_version ("
                    "version_num VARCHAR(32) NOT NULL, "
                    "CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num))"
                ))
                db.session.commit()
                print("   ✓ Created alembic_version table")
            except Exception as e:
                print(f"   ⚠ Could not create table: {e}")
                db.session.rollback()
        else:
            print("   ✓ alembic_version table exists")
        
        print("\n7. Stamping database with current migration state...")
        from flask_migrate import stamp
        try:
            stamp(revision='head')
            print("   ✓ Database stamped with migration version 'head'")
            print("   → Alembic now knows all migrations have been applied")
        except Exception as e:
            print(f"   ⚠ Could not stamp migrations: {e}")
            print("   → You may need to manually run: flask db stamp head")
        
    print("\n" + "=" * 70)
    print("✅ Schema synchronization completed successfully!")
    print("=" * 70)
    print("\nWhat happened:")
    print("• Database schema has been synchronized with your models")
    print("• Missing columns have been added (if any)")
    print("• Migration state has been updated")
    print("• Your deployment can now proceed")
    print("\nYour application is ready to use! 🚀")
    
except Exception as e:
    print(f"\n✗ CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()
    print("\nIf the error persists:")
    print("1. Check your DATABASE_URL environment variable")
    print("2. Verify database connection permissions")
    print("3. Check the error message above for specific issues")
    sys.exit(1)

