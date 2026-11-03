from sqlalchemy import Column, String, Boolean, Text
from ..db.base import BaseEntity


class Role(BaseEntity):
    """
    Access Roles registry with associated granular permissions list mapping.
    """
    __tablename__ = "roles"

    name             = Column(String(100), nullable=False, unique=True, index=True)
    description      = Column(Text, nullable=True)
    permissions_json = Column(Text, nullable=False)  # JSON list of permissions
    is_system        = Column(Boolean, default=False)
