import psycopg2

def check_db():
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/tileflow001")
    cur = conn.cursor()
    
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
    tables = [r[0] for r in cur.fetchall()]
    print("Tables in tileflow001:", tables)

    # Inspect customer table columns
    if 'customers' in tables:
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='customers';")
        cols = [r[0] for r in cur.fetchall()]
        print("Customer columns:", cols)
        cur.execute("SELECT * FROM customers WHERE name ILIKE '%Reliance%' LIMIT 5;")
        print("Customers rows:", cur.fetchall())

    if 'customer_addresses' in tables:
        cur.execute("SELECT * FROM customer_addresses LIMIT 5;")
        print("Customer addresses:", cur.fetchall())

    if 'customer_sites' in tables:
        cur.execute("SELECT * FROM customer_sites LIMIT 5;")
        print("Customer sites:", cur.fetchall())

    # Check invoice_document_artifacts
    if 'invoice_document_artifacts' in tables:
        cur.execute("SELECT * FROM invoice_document_artifacts WHERE invoice_no LIKE '%73%';")
        print("invoice_document_artifacts for 73:", cur.fetchall())
        
    conn.close()

if __name__ == "__main__":
    check_db()
