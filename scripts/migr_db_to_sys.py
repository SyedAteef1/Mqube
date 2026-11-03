import sys, psycopg2

sys.stdout.reconfigure(encoding='utf-8')

MAINTENANCE_DB = "postgresql://postgres:postgres@localhost:5432/postgres"
OLD_DB_NAME = "tileflow_retail_db"
NEW_DB_NAME = "tileflowsys"

def rename_database():
    print("============================================================")
    print("TILEFLOW CONTROL PLANE — DATABASE IDENTITY RENAME ENGINE")
    print(f"  Old Database Name: {OLD_DB_NAME}")
    print(f"  New Database Name: {NEW_DB_NAME}")
    print("============================================================")

    # 1. Connect to postgres maintenance database
    conn = psycopg2.connect(MAINTENANCE_DB)
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute("SELECT datname FROM pg_database WHERE datname = %s;", (NEW_DB_NAME,))
    if cur.fetchone():
        print(f"ℹ️ Database '{NEW_DB_NAME}' ALREADY EXISTS. Skipping rename.")
        conn.close()
        return

    cur.execute("SELECT datname FROM pg_database WHERE datname = %s;", (OLD_DB_NAME,))
    if not cur.fetchone():
        print(f"❌ FAIL: Source database '{OLD_DB_NAME}' does not exist!")
        conn.close()
        sys.exit(1)

    print(f"Terminating active connections to {OLD_DB_NAME}...")
    cur.execute("""
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = %s
          AND pid <> pg_backend_pid();
    """, (OLD_DB_NAME,))

    print(f"Executing: ALTER DATABASE {OLD_DB_NAME} RENAME TO {NEW_DB_NAME};")
    cur.execute(f'ALTER DATABASE "{OLD_DB_NAME}" RENAME TO "{NEW_DB_NAME}";')
    conn.close()

    print(f"✅ DATABASE RENAME COMPLETED: '{OLD_DB_NAME}' -> '{NEW_DB_NAME}'")

    # 2. Verify new database connection & contents
    new_conn = psycopg2.connect(f"postgresql://postgres:postgres@localhost:5432/{NEW_DB_NAME}")
    new_cur = new_conn.cursor()

    new_cur.execute("SELECT COUNT(*) FROM tileflow_menus;")
    menus_cnt = new_cur.fetchone()[0]

    new_cur.execute("SELECT COUNT(*) FROM tileflow_audit_log;")
    audit_cnt = new_cur.fetchone()[0]

    new_conn.close()

    print("\n--- VERIFICATION OF TILEFLOWSYS CONTROL PLANE ---")
    print(f"  Database Name         : {NEW_DB_NAME}")
    print(f"  tileflow_menus Count    : {menus_cnt} rows (Expected 34)")
    print(f"  tileflow_audit_log Count: {audit_cnt} rows (Expected 40)")

    assert menus_cnt == 34, f"tileflow_menus row count mismatch! Expected 34, got {menus_cnt}"
    assert audit_cnt == 40, f"tileflow_audit_log row count mismatch! Expected 40, got {audit_cnt}"

    print("\nSTATUS: TILEFLOWSYS_MIGRATION_PASSED")

if __name__ == "__main__":
    rename_database()
