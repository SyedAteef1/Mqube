"""
PHASE 2B: Check tileflowsys (control-plane) for divergence
"""
import psycopg2

def get_table_list(conn_str):
    """Get list of tables in public schema"""
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' ORDER BY table_name
    """)
    tables = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()
    return tables

print("[PHASE 2B] Checking tileflowsys (control-plane) schema...")
print("="*70)

fresh_tables = set(get_table_list('postgresql://postgres:postgres@localhost:5432/tileflow_diag_fresh'))
tileflowsys_tables = set(get_table_list('postgresql://postgres:postgres@localhost:5432/tileflowsys'))

print(f"Fresh DB (canonical): {len(fresh_tables)} tables")
print(f"tileflowsys (control-plane): {len(tileflowsys_tables)} tables")

only_in_fresh = fresh_tables - tileflowsys_tables
only_in_tileflowsys = tileflowsys_tables - fresh_tables

print("\n" + "="*70)
if len(only_in_fresh) + len(only_in_tileflowsys) == 0:
    print("✓ TILEFLOWSYS SCHEMA PARITY: PERFECT MATCH WITH FRESH DB")
else:
    print("✗ TILEFLOWSYS SCHEMA DIVERGENCE DETECTED")
    
    if only_in_fresh:
        print(f"\nTables ONLY in fresh DB ({len(only_in_fresh)}):")
        for table in sorted(only_in_fresh):
            print(f"  - {table}")
    
    if only_in_tileflowsys:
        print(f"\nTables ONLY in tileflowsys ({len(only_in_tileflowsys)}):")
        for table in sorted(only_in_tileflowsys):
            print(f"  - {table}")

print("\n" + "="*70)
print("VERDICT:")
print("="*70)

if len(only_in_fresh) + len(only_in_tileflowsys) == 0:
    print("✓ CONTROL-PLANE (tileflowsys) IS CANONICALLY CORRECT")
    print("  - tileflowsys matches fresh database perfectly")
    print("  - Can be used as reference for migration integrity")
else:
    print("✗ CONTROL-PLANE (tileflowsys) ALSO DIVERGED")
    print(f"  - {len(only_in_tileflowsys)} extra tables in tileflowsys")
    print(f"  - {len(only_in_fresh)} missing tables in tileflowsys")
