"""
Stamp tileflow001 to correct alembic revision.
The schema changes from v1376-v1382 appear to have been applied,
but alembic_version is still at v1375.
"""
import subprocess
import os
import psycopg2
import sys

os.chdir('f:\\SMRITRretailNX\\backend')
os.environ['PYTHONPATH'] = 'f:\\SMRITRretailNX'

# Get current revision for both databases
def get_current_revision(db_name):
    try:
        conn = psycopg2.connect(f'postgresql://postgres:postgres@localhost:5432/{db_name}')
        cur = conn.cursor()
        cur.execute("SELECT version_num FROM alembic_version LIMIT 1;")
        row = cur.fetchone()
        cur.close()
        conn.close()
        return row[0] if row else "NONE"
    except Exception as e:
        return f"ERROR: {e}"

# Check which columns already exist in tileflow001
def check_columns_in_tileflow001():
    try:
        conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/tileflow001')
        cur = conn.cursor()
        
        print("Checking schema in tileflow001:")
        print()
        
        # Check for idempotency_key in sales_returns
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='sales_returns' AND column_name='idempotency_key'
            );
        """)
        has_idempo = cur.fetchone()[0]
        print(f"  sales_returns.idempotency_key: {'EXISTS' if has_idempo else 'MISSING'}")
        
        # Check for tileflow_menus table (added in v1382)
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name='tileflow_menus'
            );
        """)
        has_menus = cur.fetchone()[0]
        print(f"  tileflow_menus table: {'EXISTS' if has_menus else 'MISSING'}")
        
        # Check for company_code column
        cur.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='companies' AND column_name='company_code'
            );
        """)
        has_company_code = cur.fetchone()[0]
        print(f"  companies.company_code: {'EXISTS' if has_company_code else 'MISSING'}")
        
        cur.close()
        conn.close()
        return
    except Exception as e:
        print(f"ERROR checking columns: {e}")

print("=" * 70)
print("CURRENT STATE")
print("=" * 70)
check_columns_in_tileflow001()
print()

print("=" * 70)
print("STAMPING tileflow001 TO v1382_menu_registry...")
print("=" * 70)
print()

# Stamp the database to v1382_menu_registry
result = subprocess.run(
    [sys.executable, '-m', 'alembic', '-x', 'db=tileflow001', 'stamp', 'v1382_menu_registry'],
    cwd='f:\\SMRITRretailNX\\backend',
    capture_output=True,
    text=True
)

print("STDOUT:")
print(result.stdout)
if result.stderr:
    print("STDERR:")
    print(result.stderr)
print(f"Return Code: {result.returncode}")
print()

print("=" * 70)
print("VERIFICATION")
print("=" * 70)

tileflowsys_after = get_current_revision('tileflowsys')
tileflow001_after = get_current_revision('tileflow001')

print(f"tileflowsys (Control Plane):  {tileflowsys_after}")
print(f"tileflow001 (Operational):    {tileflow001_after}")
print()

if tileflowsys_after == tileflow001_after:
    print(f"✓ SUCCESS: Both databases at {tileflowsys_after}")
else:
    print(f"✗ MISMATCH: tileflowsys={tileflowsys_after}, tileflow001={tileflow001_after}")
