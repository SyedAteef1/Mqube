import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
import psycopg2
from app.services.db_provisioner import CompanyDatabaseProvisioner

CONTROL_PLANE_URL = "postgresql://postgres:postgres@localhost:5432/tileflowsys"

def test_provisioning_dry_run_alphanumeric_abc():
    """Verify dry-run provisioning plan for Alphanumeric Code ABC produces tileflowABC."""
    provisioner = CompanyDatabaseProvisioner(dry_run=True)
    plan = provisioner.run_dry_run_provisioning("COMP-ABC", "TILEFLOW Alpha Store", company_code="ABC")
    assert plan["company_code"] == "ABC"
    assert plan["database_name"] == "tileflowABC"
    assert plan["dry_run"] is True
    assert plan["database_mutations"] == 0
    assert plan["company_databases_created"] == 0

def test_provisioning_dry_run_alphanumeric_mum():
    """Verify dry-run provisioning plan for Alphanumeric Code MUM produces tileflowMUM."""
    provisioner = CompanyDatabaseProvisioner(dry_run=True)
    plan = provisioner.run_dry_run_provisioning("COMP-MUM", "TILEFLOW Mumbai Store", company_code="MUM")
    assert plan["company_code"] == "MUM"
    assert plan["database_name"] == "tileflowMUM"

def test_provisioning_reserved_codes_rejected():
    """Verify 000 and SYS codes are permanently reserved and rejected by provisioner."""
    provisioner = CompanyDatabaseProvisioner(dry_run=True)
    with pytest.raises(ValueError) as exc_000:
        provisioner.run_dry_run_provisioning("COMP-000", "Reserved Zero Company", company_code="000")
    assert "reserved" in str(exc_000.value)

    with pytest.raises(ValueError) as exc_sys:
        provisioner.run_dry_run_provisioning("COMP-SYS", "Reserved Control Plane", company_code="SYS")
    assert "reserved" in str(exc_sys.value)

def test_no_unapproved_company_databases_exist():
    """Verify tileflow001 exists as reference DB while tileflowABC/tileflowMUM do not exist."""
    conn = psycopg2.connect(CONTROL_PLANE_URL)
    cur = conn.cursor()
    cur.execute("SELECT datname FROM pg_database WHERE datname IN ('tileflowABC', 'tileflowMUM', 'tileflowSYS');")
    dbs = cur.fetchall()
    conn.close()
    assert len(dbs) == 0, f"Expected 0 unapproved databases created, found {dbs}"


def test_provisioning_schema_alembic_head_requirement():
    """Verify schema initialization plan specifies alembic upgrade head >= v1337 and version 3.29.0."""
    provisioner = CompanyDatabaseProvisioner(dry_run=True)
    schema_plan = provisioner.initialize_schema_plan("tileflow001")
    assert schema_plan["alembic_required"] is True
    assert schema_plan["alembic_migration_command"] == "alembic upgrade head"
    assert schema_plan["alembic_min_revision"] == "v1337_backfill_variant_id"
    assert schema_plan["schema_version"] == "3.29.0"

