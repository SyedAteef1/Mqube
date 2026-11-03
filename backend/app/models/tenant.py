import uuid as uuid_pkg
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..db.base import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(String(50), primary_key=True)
    uuid = Column(String(36), default=lambda: str(uuid_pkg.uuid4()), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    gst_number = Column(String(15), nullable=True)
    company_code = Column(String(50), nullable=True, unique=True, index=True)
    logo_url = Column(String(500), nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    bank_name = Column(String(255), nullable=True)
    bank_account_name = Column(String(255), nullable=True)
    bank_account_no = Column(String(50), nullable=True)
    bank_ifsc = Column(String(20), nullable=True)
    bank_branch = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    modified_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

class Branch(Base):
    __tablename__ = "branches"

    id = Column(String(50), primary_key=True)
    uuid = Column(String(36), default=lambda: str(uuid_pkg.uuid4()), unique=True, nullable=False)
    company_id = Column(String(50), ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    modified_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", backref="branches")
