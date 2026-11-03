from sqlalchemy import Column, String, Boolean, Text, DateTime
from ..db.base import BaseEntity, Base

class TileFlowPermission(BaseEntity):
    """
    Maps to existing 'tileflow_permissions' table in tileflowsys.
    Stores granular action-level permissions (e.g. resource='sales_billing', action='VOID', scope='User:002').
    """
    __tablename__ = "tileflow_permissions"

    code         = Column(String(100), nullable=False)
    resource     = Column(String(100), nullable=False)
    action       = Column(String(50), nullable=False)
    scope        = Column(String(50), nullable=False)  # e.g., 'User:002', 'Group:002', 'Node:NODE-01'
    module       = Column(String(100), nullable=False, default="core")
    description  = Column(Text, nullable=True)
    tenant_id    = Column(String(50), nullable=True)


class TileFlowAuditLog(Base):
    """
    Maps to existing 'tileflow_audit_log' table in tileflowsys.
    Immutable tamper-evident audit journal for all configuration, menu, and security changes.
    """
    __tablename__ = "tileflow_audit_log"

    id                = Column(String(50), primary_key=True)
    tenant_id         = Column(String(50), nullable=True)
    entity_id         = Column(String(100), nullable=True)
    changed_table     = Column(String(100), nullable=False)
    changed_record_id = Column(String(100), nullable=False)
    field_name        = Column(String(100), nullable=True)
    old_value         = Column(Text, nullable=True)
    new_value         = Column(Text, nullable=True)
    change_type       = Column(String(50), nullable=False)
    change_reason     = Column(Text, nullable=True)
    change_source     = Column(String(100), nullable=True)
    changed_by        = Column(String(50), nullable=True)
    changed_by_name   = Column(String(100), nullable=True)
    changed_at        = Column(DateTime(timezone=True), nullable=True)
    sha256_hash       = Column(String(64), nullable=True)
