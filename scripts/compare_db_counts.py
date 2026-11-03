import psycopg2

conn_sys = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/tileflowsys")
cur_sys = conn_sys.cursor()
cur_sys.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
print("tileflowsys table count:", cur_sys.fetchone()[0])
try:
    cur_sys.execute("SELECT count(*) FROM sales_invoices;")
    print("tileflowsys sales_invoices count:", cur_sys.fetchone()[0])
except Exception as e:
    print("tileflowsys sales_invoices error:", e)
conn_sys.close()

conn_001 = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/tileflow001")
cur_001 = conn_001.cursor()
cur_001.execute("SELECT count(*) FROM sales_invoices;")
print("tileflow001 sales_invoices count:", cur_001.fetchone()[0])
conn_001.close()
