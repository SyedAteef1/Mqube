import psycopg2
import json

def main():
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/tileflow001")
    cur = conn.cursor()
    
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sales_invoices'
        ORDER BY ordinal_position;
    """)
    cols = [r[0] for r in cur.fetchall()]
    
    cur.execute("SELECT * FROM sales_invoices WHERE invoice_no = 'TT2026-2027/73';")
    row = cur.fetchone()
    
    if row:
        row_dict = dict(zip(cols, row))
        print("=== INVOICE TT2026-2027/73 in tileflow001.sales_invoices ===")
        for k, v in row_dict.items():
            print(f"{k}: {repr(v)}")
    else:
        print("Invoice not found.")

    # Also check if there are other tables like invoice_document_artifacts, customers, sales_invoice_items, etc.
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE '%invoice%';
    """)
    tables = [r[0] for r in cur.fetchall()]
    print("\nInvoice related tables:", tables)

    for t in tables:
        if t != 'sales_invoices':
            try:
                cur.execute(f"SELECT * FROM {t} WHERE invoice_no = 'TT2026-2027/73' OR invoice_id = 'inv-tt-73' LIMIT 5;")
                rows = cur.fetchall()
                print(f"[{t}] Found {len(rows)} rows for 73")
                for r in rows:
                    print("  ", r)
            except Exception as e:
                # Column might not exist
                pass

    conn.close()

if __name__ == "__main__":
    main()
