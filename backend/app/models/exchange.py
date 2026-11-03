from sqlalchemy import Column, String, Text, DateTime
from ..db.base import BaseEntity


class DataExchangeTask(BaseEntity):
    """
    Registry of configured CSV/JSON/XML data exchange integration tasks.
    """
    __tablename__ = "data_exchange_tasks"

    name        = Column(String(200), nullable=False)
    direction   = Column(String(20), nullable=False)    # Import, Export
    entity_type = Column(String(100), nullable=False)   # Products, Customers, Suppliers, Invoices
    file_type   = Column(String(50), default="CSV")     # CSV, JSON, XML
    mapping_id  = Column(String(50), nullable=True)
    status      = Column(String(50), default="Idle")     # Idle, Running, Success, Failed
    last_run    = Column(DateTime, nullable=True)
    last_log    = Column(Text, nullable=True)


class DataExchangeFieldMapping(BaseEntity):
    """
    Field-level schema conversion mapping translation dictionary rules.
    """
    __tablename__ = "data_exchange_field_mappings"

    name               = Column(String(200), nullable=False)
    entity_type        = Column(String(100), nullable=False)
    mapping_rules_json = Column(Text, nullable=False)  # JSON maps of external-to-internal headers key-values
