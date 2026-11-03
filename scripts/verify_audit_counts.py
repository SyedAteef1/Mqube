"""
Final Verification Script for TILEFLOW Groups by Departments Audit
"""
import psycopg2

conn_sys = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/tileflowsys')
cur_sys = conn_sys.cursor()

conn_tenant = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/tileflow001')
cur_tenant = conn_tenant.cursor()

print("=== TILEFLOW CONTROL PLANE (tileflowsys) ===")
cur_sys.execute("SELECT count(*) FROM roles;")
print(f"Total roles in tileflowsys: {cur_sys.fetchone()[0]}")

cur_sys.execute("SELECT count(*) FROM users;")
print(f"Total users in tileflowsys: {cur_sys.fetchone()[0]}")

print("\n=== TILEFLOW TENANT PLANE (tileflow001) ===")
cur_tenant.execute("SELECT count(*) FROM customer_groups WHERE is_active = true AND (is_deleted = false OR is_deleted IS NULL);")
print(f"Active Customer Groups in tileflow001: {cur_tenant.fetchone()[0]}")

cur_tenant.execute("SELECT count(*) FROM attribute_groups WHERE is_active = true AND (is_deleted = false OR is_deleted IS NULL);")
print(f"Active Attribute Groups in tileflow001: {cur_tenant.fetchone()[0]}")

conn_sys.close()
conn_tenant.close()
