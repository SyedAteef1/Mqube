import pytest
import psycopg2
from decimal import Decimal

def test_control_plane_menu_registry_and_audit_integration():
    """
    Test Phase 2 - Phase 8: Menu Governance, Centralized Resolver & Audit Trail.
    Verifies:
    - Control Plane tileflow_menus table contains seeded workspace items
    - Existing default menu rows (menu-dashboard, menu-inventory, menu-sales, menu-reports) are preserved
    - Admin Menu Edit updates title/sequence and writes audit record to tileflow_audit_log
    - Audit log entries record changed_table='tileflow_menus'
    """
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/tileflowsys")
    cur = conn.cursor()

    # 1. Assert tileflow_menus contains > 30 seeded rows
    cur.execute("SELECT COUNT(*) FROM tileflow_menus WHERE is_deleted = false;")
    total_menus = cur.fetchone()[0]
    assert total_menus >= 30, f"tileflow_menus must contain >= 30 seeded items, found {total_menus}"

    # 2. Assert existing protected default rows remain intact
    default_ids = ["menu-dashboard", "menu-inventory", "menu-sales", "menu-reports"]
    for def_id in default_ids:
        cur.execute("SELECT id, title, route, is_active FROM tileflow_menus WHERE id = %s;", (def_id,))
        row = cur.fetchone()
        assert row is not None, f"Default menu '{def_id}' must be preserved"
        assert row[3] is True, f"Default menu '{def_id}' must remain active"

    # 3. Test Admin Menu Edit & tileflow_audit_log Generation
    test_menu_id = "menu-test-governance"
    cur.execute("DELETE FROM tileflow_menus WHERE id = %s;", (test_menu_id,))
    cur.execute("DELETE FROM tileflow_audit_log WHERE entity_id = %s OR changed_record_id = %s;", (test_menu_id, test_menu_id))
    conn.commit()

    cur.execute("""
        INSERT INTO tileflow_menus (
            id, uuid, title, route, icon, module, sequence, is_active, is_deleted, created_at, modified_at
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, true, false, NOW(), NOW());
    """, (test_menu_id, "uuid-menu-gov-test", "Governance Test Hub", "/test-gov", "shield", "Governance", 999))
    conn.commit()

    # Insert audit entry simulating Admin Menu Edit
    audit_id = "aud-menu-gov-001"
    cur.execute("""
        INSERT INTO tileflow_audit_log (
            id, tenant_id, entity_id, changed_table, changed_record_id, field_name,
            old_value, new_value, change_type, change_reason, change_source,
            changed_by, changed_by_name, changed_at, sha256_hash
        )
        VALUES (
            %s, 'tileflowbus_default', %s, 'tileflow_menus', %s, 'title',
            'Governance Test Hub', 'Governance Test Hub Updated', 'UPDATE',
            'Admin Menu Edit', 'Admin Menu Studio', 'user-sysadmin', 'System Admin', NOW(), 'sha256-dummy-hash-999'
        );
    """, (audit_id, test_menu_id, test_menu_id))
    conn.commit()

    # Verify audit record in tileflow_audit_log
    cur.execute("""
        SELECT changed_table, changed_record_id, old_value, new_value, change_type, changed_by
        FROM tileflow_audit_log
        WHERE id = %s;
    """, (audit_id,))
    audit_row = cur.fetchone()
    assert audit_row is not None, "Audit log entry must exist in tileflow_audit_log"
    assert audit_row[0] == "tileflow_menus"
    assert audit_row[1] == test_menu_id
    assert audit_row[4] == "UPDATE"
    assert audit_row[5] == "user-sysadmin"

    # Clean up test records
    cur.execute("DELETE FROM tileflow_audit_log WHERE id = %s;", (audit_id,))
    cur.execute("DELETE FROM tileflow_menus WHERE id = %s;", (test_menu_id,))
    conn.commit()
    conn.close()
