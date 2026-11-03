import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app.services.db_resolver import (
    generate_company_database_name,
    validate_company_database_name
)

class CompanyLifecycleStateMachine:
    """
    TILEFLOW Company Database Lifecycle State Machine.
    Governs allowed state transitions:
    PROVISIONING -> READY -> SUSPENDED -> READY
    READY -> ARCHIVED -> DECOMMISSIONED
    PROVISION_FAILED -> RECOVERY_REQUIRED -> READY
    """

    ALLOWED_TRANSITIONS = {
        "PROVISIONING": {"READY", "PROVISION_FAILED"},
        "READY": {"SUSPENDED", "ARCHIVED"},
        "SUSPENDED": {"READY", "ARCHIVED"},
        "ARCHIVED": {"READ_ONLY", "DECOMMISSIONED"},
        "READ_ONLY": {"ARCHIVED", "DECOMMISSIONED"},
        "PROVISION_FAILED": {"RECOVERY_REQUIRED"},
        "RECOVERY_REQUIRED": {"READY", "DECOMMISSIONED"},
        "DECOMMISSIONED": set()  # Terminal state
    }

    @classmethod
    def validate_transition(cls, current_status: str, target_status: str) -> bool:
        allowed = cls.ALLOWED_TRANSITIONS.get(current_status, set())
        return target_status in allowed

def test_lifecycle_allowed_transitions():
    """Verify valid lifecycle transitions are permitted."""
    assert CompanyLifecycleStateMachine.validate_transition("PROVISIONING", "READY") is True
    assert CompanyLifecycleStateMachine.validate_transition("READY", "SUSPENDED") is True
    assert CompanyLifecycleStateMachine.validate_transition("SUSPENDED", "READY") is True
    assert CompanyLifecycleStateMachine.validate_transition("READY", "ARCHIVED") is True
    assert CompanyLifecycleStateMachine.validate_transition("ARCHIVED", "DECOMMISSIONED") is True

def test_lifecycle_disallowed_transitions():
    """Verify invalid lifecycle transitions are rejected."""
    assert CompanyLifecycleStateMachine.validate_transition("DECOMMISSIONED", "READY") is False  # Terminal state
    assert CompanyLifecycleStateMachine.validate_transition("PROVISIONING", "ARCHIVED") is False
    assert CompanyLifecycleStateMachine.validate_transition("SUSPENDED", "PROVISIONING") is False

def test_lifecycle_naming_integration():
    """Verify lifecycle DB name generation retains tileflow<A-Z0-9> standard."""
    assert generate_company_database_name("ABC") == "tileflowABC"
    assert generate_company_database_name("MUM") == "tileflowMUM"
    assert validate_company_database_name("tileflowABC") is True
    assert validate_company_database_name("tileflow000") is False
    assert validate_company_database_name("tileflowSYS") is False
