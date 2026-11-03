import psycopg2

conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/tileflow001")
cur = conn.cursor()
cur.execute("SELECT invoice_no, date, sis_code, grand_total FROM sales_invoices WHERE invoice_no IN ('TT2026-2027/101', 'TT2026-2027/102', 'TT2026-2027/103');")
for r in cur.fetchall():
    print(r)
conn.close()
