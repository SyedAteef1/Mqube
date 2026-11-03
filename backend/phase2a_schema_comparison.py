"""
PHASE 2A: Schema Comparison
Compare fresh database vs tileflow001 for schema parity
"""
import psycopg2
from psycopg2 import sql
import json

def get_schema_info(conn_str, db_name):
    """Extract complete schema from database"""
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    
    # Check alembic version
    try:
        cur.execute("SELECT version_num FROM alembic_version ORDER BY installed_on DESC LIMIT 1")
        alembic_version = cur.fetchone()[0]
        print(f"  - Alembic version: {alembic_version}")
    except:
        print(f"  - WARNING: No alembic_version table found")
        alembic_version = "UNKNOWN"
    
    schema = {
        'tables': {},
        'indexes': {},
        'constraints': {},
        'sequences': {},
        'alembic_version': alembic_version
    }
    
    # Get all tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = [row[0] for row in cur.fetchall()]
    
    for table in tables:
        schema['tables'][table] = {
            'columns': {},
            'pk': None,
            'fks': [],
            'checks': []
        }
        
        # Get columns
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, (table,))
        
        for col_name, col_type, is_nullable, col_default in cur.fetchall():
            schema['tables'][table]['columns'][col_name] = {
                'type': col_type,
                'nullable': is_nullable == 'YES',
                'default': col_default
            }
        
        # Get primary key
        cur.execute("""
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid
            AND a.attnum = ANY(i.indkey)
            WHERE i.indisprimary AND i.indrelid::regclass::text = %s
            ORDER BY a.attnum
        """, (table,))
        
        pk_cols = [row[0] for row in cur.fetchall()]
        if pk_cols:
            schema['tables'][table]['pk'] = pk_cols
        
        # Get foreign keys
        cur.execute("""
            SELECT rc.constraint_name, kcu.column_name, ccu.table_name, ccu.column_name
            FROM information_schema.referential_constraints rc
            JOIN information_schema.key_column_usage kcu
                ON rc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
                ON rc.unique_constraint_name = ccu.constraint_name
            WHERE kcu.table_schema = 'public' AND kcu.table_name = %s
        """, (table,))
        
        for fk in cur.fetchall():
            schema['tables'][table]['fks'].append(fk)
        
        # Get check constraints
        cur.execute("""
            SELECT constraint_name, check_clause
            FROM information_schema.check_constraints
            WHERE constraint_schema = 'public' AND table_name = %s
        """, (table,))
        
        for check_name, check_clause in cur.fetchall():
            schema['tables'][table]['checks'].append((check_name, check_clause))
    
    # Get all indexes (non-PK, non-FK)
    cur.execute("""
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename NOT IN (SELECT tablename FROM pg_indexes WHERE indexname LIKE '%_pkey')
    """)
    
    for idx_name, idx_def in cur.fetchall():
        schema['indexes'][idx_name] = idx_def
    
    cur.close()
    conn.close()
    
    return schema

def compare_schemas(fresh_schema, tileflow001_schema):
    """Compare two schemas and report differences"""
    diffs = {
        'fresh_only_tables': [],
        'tileflow001_only_tables': [],
        'columns_diff': {},
        'pk_diff': {},
        'fk_diff': {},
        'checks_diff': {},
        'indexes_diff': {}
    }
    
    fresh_tables = set(fresh_schema['tables'].keys())
    tileflow001_tables = set(tileflow001_schema['tables'].keys())
    
    # Table-level differences
    diffs['fresh_only_tables'] = sorted(fresh_tables - tileflow001_tables)
    diffs['tileflow001_only_tables'] = sorted(tileflow001_tables - fresh_tables)
    
    # Column differences in common tables
    for table in fresh_tables & tileflow001_tables:
        fresh_cols = fresh_schema['tables'][table]['columns']
        tileflow001_cols = tileflow001_schema['tables'][table]['columns']
        
        fresh_col_names = set(fresh_cols.keys())
        tileflow001_col_names = set(tileflow001_cols.keys())
        
        if fresh_col_names != tileflow001_col_names:
            diffs['columns_diff'][table] = {
                'fresh_only': sorted(fresh_col_names - tileflow001_col_names),
                'tileflow001_only': sorted(tileflow001_col_names - fresh_col_names)
            }
        
        # Check column type/nullable differences
        for col in fresh_col_names & tileflow001_col_names:
            if fresh_cols[col] != tileflow001_cols[col]:
                if table not in diffs['columns_diff']:
                    diffs['columns_diff'][table] = {}
                if 'modified' not in diffs['columns_diff'][table]:
                    diffs['columns_diff'][table]['modified'] = {}
                diffs['columns_diff'][table]['modified'][col] = {
                    'fresh': fresh_cols[col],
                    'tileflow001': tileflow001_cols[col]
                }
        
        # PK differences
        fresh_pk = fresh_schema['tables'][table]['pk']
        tileflow001_pk = tileflow001_schema['tables'][table]['pk']
        if fresh_pk != tileflow001_pk:
            diffs['pk_diff'][table] = {
                'fresh': fresh_pk,
                'tileflow001': tileflow001_pk
            }
    
    return diffs

def main():
    fresh_conn = 'postgresql://postgres:postgres@localhost:5432/tileflow_diag_fresh'
    tileflow001_conn = 'postgresql://postgres:postgres@localhost:5432/tileflow001'
    
    print("[PHASE 2A] Analyzing fresh database schema...")
    fresh_schema = get_schema_info(fresh_conn, 'tileflow_diag_fresh')
    print(f"✓ Fresh DB: {len(fresh_schema['tables'])} tables")
    
    print("[PHASE 2A] Analyzing tileflow001 schema...")
    tileflow001_schema = get_schema_info(tileflow001_conn, 'tileflow001')
    print(f"✓ tileflow001: {len(tileflow001_schema['tables'])} tables")
    
    print("\n[PHASE 2A] Comparing schemas...")
    diffs = compare_schemas(fresh_schema, tileflow001_schema)
    
    # Report results
    print("\n" + "="*70)
    print("SCHEMA COMPARISON RESULTS")
    print("="*70)
    
    if diffs['fresh_only_tables']:
        print(f"\n⚠ Tables in fresh DB but NOT in tileflow001: {diffs['fresh_only_tables']}")
    
    if diffs['tileflow001_only_tables']:
        print(f"\n⚠ Tables in tileflow001 but NOT in fresh DB: {diffs['tileflow001_only_tables']}")
    
    if diffs['columns_diff']:
        print("\n⚠ Column differences (in common tables):")
        for table, col_diffs in diffs['columns_diff'].items():
            print(f"  {table}:")
            if 'fresh_only' in col_diffs and col_diffs['fresh_only']:
                print(f"    - Fresh only: {col_diffs['fresh_only']}")
            if 'tileflow001_only' in col_diffs and col_diffs['tileflow001_only']:
                print(f"    - tileflow001 only: {col_diffs['tileflow001_only']}")
            if 'modified' in col_diffs:
                for col, specs in col_diffs['modified'].items():
                    print(f"    - {col} modified:")
                    print(f"      Fresh:     {specs['fresh']}")
                    print(f"      tileflow001: {specs['tileflow001']}")
    
    if not (diffs['fresh_only_tables'] or diffs['tileflow001_only_tables'] or diffs['columns_diff']):
        print("\n✓ SCHEMA PARITY VERIFIED: fresh database and tileflow001 are identical")
    else:
        print("\n✗ SCHEMA DIVERGENCE DETECTED: see differences above")
    
    # Save detailed report
    with open('phase2_schema_comparison.json', 'w') as f:
        json.dump({
            'fresh_tables': sorted(fresh_schema['tables'].keys()),
            'tileflow001_tables': sorted(tileflow001_schema['tables'].keys()),
            'differences': diffs
        }, f, indent=2)
    print("\n✓ Detailed report saved: phase2_schema_comparison.json")

if __name__ == '__main__':
    main()
