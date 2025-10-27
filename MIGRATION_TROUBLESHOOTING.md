# Database Migration Troubleshooting Guide

## Problem: "column already exists" Error During Deployment

### What Causes This Error?

This error occurs when:
1. Your database already has some schema (tables/columns)
2. Alembic (the migration tool) thinks it needs to create these from scratch
3. The migration history in the database doesn't match your migration files

This commonly happens when:
- Deploying to a new environment with an existing database
- The database was partially migrated or manually created
- Migration history was lost or incomplete

### The Error Message

```
psycopg2.errors.DuplicateColumn: column "expected_wage" of relation "candidate" already exists
[SQL: ALTER TABLE candidate ADD COLUMN expected_wage VARCHAR(120)]
```

## Our Solution

We've implemented an **automatic recovery system** in the deployment process:

### 1. Enhanced `build.sh`

The build script now:
- Attempts to run migrations normally
- If it detects "already exists" errors, it automatically runs a fix script
- Synchronizes the database schema with the migration state
- Continues deployment without manual intervention

### 2. Improved `fix_migration_conflict.py`

This script:
- Inspects your actual database schema
- Compares it with what the migrations expect
- Adds any missing columns
- Stamps the database with the correct migration version
- Tells Alembic that all migrations have been applied

## How to Deploy the Fix

### For Your Main Branch Render Instance:

1. **Commit these changes:**
   ```bash
   git add backend/build.sh backend/fix_migration_conflict.py
   git commit -m "Fix: Add automatic migration conflict resolution"
   git push origin main
   ```

2. **Redeploy on Render:**
   - Go to your Render dashboard
   - Find your main branch service
   - Click "Manual Deploy" > "Deploy latest commit"

3. **What Will Happen:**
   - The build will start
   - When migrations fail, the script will detect it
   - The fix script will run automatically
   - Database schema will be synchronized
   - Deployment will complete successfully ✅

## Manual Recovery (If Needed)

If you need to manually fix the database:

1. **Access Render Shell:**
   - Go to your Render service
   - Click "Shell" tab
   - Navigate to backend: `cd backend`

2. **Run the Fix Script:**
   ```bash
   python fix_migration_conflict.py
   ```

3. **Redeploy:**
   - Exit the shell
   - Trigger a new deployment

## Prevention for Future Deployments

### Best Practices:

1. **Always use migrations for schema changes** - Never manually alter the database schema

2. **Keep migration history clean:**
   ```bash
   # Before deploying to a new environment
   flask db upgrade
   ```

3. **For new environments with existing data:**
   ```bash
   # Stamp the database without running migrations
   flask db stamp head
   ```

4. **Test migrations locally:**
   ```bash
   # Create a test database
   # Run migrations
   flask db upgrade
   # Verify everything works
   ```

## Understanding the Fix

### What `flask db stamp head` Does:

- Marks all migrations as "already applied"
- Updates the `alembic_version` table
- Tells Alembic: "The database is up-to-date, don't run old migrations"

### When to Use It:

- ✅ Database schema matches your models but migration history is missing
- ✅ You've manually created tables that match your migrations
- ✅ You're migrating from a database created by a different method

- ❌ Don't use if database is genuinely missing tables/columns
- ❌ Don't use if you need to actually run pending migrations

## Troubleshooting

### If the automatic fix doesn't work:

1. **Check the build logs** - Look for specific error messages
2. **Verify database connection** - Ensure DATABASE_URL is correct
3. **Check for schema drift** - Your models might differ from migrations
4. **Last resort**: Drop and recreate the database (only if no data loss is acceptable)

### Common Issues:

**Issue:** Script runs but migrations still fail
- **Solution:** Check if there are other schema differences beyond columns

**Issue:** Permission denied when running fix script
- **Solution:** Ensure the database user has ALTER TABLE permissions

**Issue:** Migrations work but app still fails
- **Solution:** Check for issues in your application code, not just migrations

## Getting Help

If you continue to have issues:

1. Check the full error logs in Render
2. Verify your migration files are in the correct order
3. Ensure all migration dependencies are correct
4. Consider resetting migration history and starting fresh (if acceptable)

## Related Files

- `backend/build.sh` - Deployment script with automatic recovery
- `backend/fix_migration_conflict.py` - Schema synchronization script
- `backend/migrations/versions/` - All migration files
- `backend/app/models.py` - Database models (source of truth)

---

**Last Updated:** October 2025
**Applies To:** Flask + Alembic + PostgreSQL deployments on Render

