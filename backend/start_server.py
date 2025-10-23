import sys
import traceback

try:
    print("Starting Flask server with PostgreSQL...")
    print("=" * 60)
    
    from app import create_app
    app = create_app()
    
    print(f"✓ App created successfully")
    print(f"✓ Database: {app.config['SQLALCHEMY_DATABASE_URI'].split('@')[1]}")
    print("=" * 60)
    print("Starting server on http://0.0.0.0:5000")
    print("Press CTRL+C to quit")
    print("=" * 60)
    
    app.run(debug=True, host="0.0.0.0", port=5000)
    
except Exception as e:
    print("\n" + "=" * 60)
    print("❌ ERROR STARTING SERVER")
    print("=" * 60)
    print(f"Error: {str(e)}")
    print("\nFull traceback:")
    traceback.print_exc()
    print("=" * 60)
    sys.exit(1)

