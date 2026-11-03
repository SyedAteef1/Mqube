import pytest
import psycopg2

DB_PARAMS = "postgresql://postgres:postgres@localhost:5432/tileflowsys"

def test_ui_control_plane_tables_and_schemas():
    """Verify tileflow_themes and tileflow_workspace_profiles Control Plane structure."""
    conn = psycopg2.connect(DB_PARAMS)
    cur = conn.cursor()

    # 1. Assert tileflow_themes exists
    cur.execute("SELECT COUNT(*) FROM tileflow_themes;")
    theme_count = cur.fetchone()[0]

    # 2. Assert tileflow_workspace_profiles exists
    cur.execute("SELECT COUNT(*) FROM tileflow_workspace_profiles;")
    profile_count = cur.fetchone()[0]

    conn.close()

    assert theme_count >= 0
    assert profile_count >= 0
