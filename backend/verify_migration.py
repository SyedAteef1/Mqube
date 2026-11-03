import psycopg2

# Check control-plane tables in tileflowsys
conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/tileflowsys')
cur = conn.cursor()

tables_to_check = ['company_database_registries', 'tileflow_permissions', 'tileflow_audit_log']
print('✅ Control-plane tables in tileflowsys:')
for tbl in tables_to_check:
    cur.execute(f"SELECT to_regclass('public.{tbl}') IS NOT NULL")
    exists = cur.fetchone()[0]
    status = '✅' if exists else '❌'
    print(f'  {status} {tbl}')

conn.close()

# Check platform tables in tileflow001
conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/tileflow001')
cur = conn.cursor()

platform_tables = ['platform_capabilities', 'workspace_templates', 'tenant_capability_bindings', 'user_workspace_configs', 'pdt_model_registry', 'pdt_sku_twin_cache']
print('\n✅ Platform tables in tileflow001 (sample):')
for tbl in platform_tables:
    cur.execute(f"SELECT to_regclass('public.{tbl}') IS NOT NULL")
    exists = cur.fetchone()[0]
    status = '✅' if exists else '❌'
    print(f'  {status} {tbl}')

print('\n✅ Alembic version tracking:')
cur.execute("SELECT version_num FROM alembic_version ORDER BY version_num DESC LIMIT 2")
for row in cur.fetchall():
    print(f'  {row[0]}')

conn.close()
