import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app.services.db_resolver import (
    generate_company_database_name,
    validate_company_database_name,
    CompanyDatabaseResolver
)

def test_generate_company_database_name_valid_alphanumeric():
    """Verify tileflow<4-character-alphanumeric> generation rules."""
    assert generate_company_database_name("001") == "tileflow0001"
    assert generate_company_database_name("007") == "tileflow0007"
    assert generate_company_database_name("125") == "tileflow0125"
    assert generate_company_database_name("ABC1") == "tileflowABC1"
    assert generate_company_database_name("A01B") == "tileflowA01B"
    assert generate_company_database_name("MUM1") == "tileflowMUM1"
    assert generate_company_database_name("abc1") == "tileflowABC1"  # Normalization

def test_generate_company_database_name_reserved_codes():
    """Verify 0000 and SYS0 are permanently reserved and rejected."""
    with pytest.raises(ValueError) as exc_info_000:
        generate_company_database_name("0000")
    assert "reserved" in str(exc_info_000.value)

    with pytest.raises(ValueError) as exc_info_sys:
        generate_company_database_name("SYS0")
    assert "reserved" in str(exc_info_sys.value)

def test_generate_company_database_name_invalid_format():
    """Verify invalid-length or special-character codes are rejected."""
    with pytest.raises(ValueError):
        generate_company_database_name("ABCDE")  # 5 chars
    with pytest.raises(ValueError):
        generate_company_database_name("AB1")    # 3-char alphanumeric
    with pytest.raises(ValueError):
        generate_company_database_name("A-1")   # Hyphen
    with pytest.raises(ValueError):
        generate_company_database_name("A_1")   # Underscore
    with pytest.raises(ValueError):
        generate_company_database_name("A 1")   # Space

def test_validate_company_database_name_valid():
    """Verify valid database names comply with tileflow<4-alphanumeric>."""
    assert validate_company_database_name("tileflow001") is True
    assert validate_company_database_name("tileflow0124") is True
    assert validate_company_database_name("tileflowABC1") is True
    assert validate_company_database_name("tileflowsys") is True  # Control Plane

def test_validate_company_database_name_invalid():
    """Verify reserved or invalid database names are rejected."""
    assert validate_company_database_name("tileflow0000") is False  # Reserved
    assert validate_company_database_name("tileflowSYS0") is False  # Reserved Control Plane
    assert validate_company_database_name("tileflow_001") is False # Separator forbidden
    assert validate_company_database_name("company_comp_001") is False  # Legacy prefix
    assert validate_company_database_name("tileflow-ABC") is False # Hyphen forbidden
    assert validate_company_database_name("tileflowABCDE") is False  # 5 chars forbidden

def test_resolver_enforces_alphanumeric_codes():
    """Verify CompanyDatabaseResolver resolves alphanumeric codes correctly."""
    res_001 = CompanyDatabaseResolver.resolve_company_database("usr_sysadmin", "COMP-001")
    assert res_001["database_name"] == "tileflow001"
    assert generate_company_database_name("MUM1") == "tileflowMUM1"
