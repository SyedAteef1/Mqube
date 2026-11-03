import psycopg2

conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/tileflowsys')
conn.autocommit = True
cur = conn.cursor()
cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'tileflow001';")
cur.execute("DROP DATABASE IF EXISTS tileflow001;")
print("tileflow001 dropped cleanly.")
conn.close()
