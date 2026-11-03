import sys, psycopg2

sys.stdout.reconfigure(encoding='utf-8')

def verify_db_integrity():
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/tileflowsys")
    cur = conn.cursor()

    # 1. Unique IDs check
    cur.execute("SELECT id, COUNT(*) FROM tileflow_menus GROUP BY id HAVING COUNT(*) > 1;")
    dup_ids = cur.fetchall()
    assert len(dup_ids) == 0, f"Duplicate menu IDs found: {dup_ids}"

    # 2. Unique Routes check
    cur.execute("SELECT route, COUNT(*) FROM tileflow_menus WHERE route IS NOT NULL GROUP BY route HAVING COUNT(*) > 1;")
    dup_routes = cur.fetchall()
    assert len(dup_routes) == 0, f"Duplicate menu routes found: {dup_routes}"

    # 3. Orphan parent_id check
    cur.execute("""
        SELECT m.id, m.parent_id 
        FROM tileflow_menus m 
        LEFT JOIN tileflow_menus p ON m.parent_id = p.id 
        WHERE m.parent_id IS NOT NULL AND p.id IS NULL;
    """)
    orphan_parents = cur.fetchall()
    assert len(orphan_parents) == 0, f"Orphan parent references found: {orphan_parents}"

    # 4. Protected Default System Rows check
    default_ids = ["menu-dashboard", "menu-inventory", "menu-sales", "menu-reports"]
    for def_id in default_ids:
        cur.execute("SELECT id, title, route, is_active FROM tileflow_menus WHERE id = %s;", (def_id,))
        row = cur.fetchone()
        assert row is not None, f"Protected menu '{def_id}' missing!"
        assert row[3] is True, f"Protected menu '{def_id}' inactive!"
        print(f"   - Protected Row Intact: ID={row[0]} Title='{row[1]}' Route='{row[2]}' Active={row[3]}")

    print("✅ DATABASE INTEGRITY PASSED: Unique IDs=0 duplicates, Unique Routes=0 duplicates, Orphan Parents=0, 4 Protected Records Intact.")
    conn.close()

if __name__ == "__main__":
    verify_db_integrity()
