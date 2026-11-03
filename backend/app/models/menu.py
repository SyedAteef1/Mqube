from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from ..db.base import BaseEntity

class TileFlowMenu(BaseEntity):
    """
    Control Plane Menu Registry mapped to existing tileflow_menus PostgreSQL table.
    Global system menus have tenant_id=None, company_id=None, branch_id=None.
    Location/company specific overrides populate company_id/branch_id.
    """
    __tablename__ = "tileflow_menus"

    title        = Column(String(255), nullable=False)
    route        = Column(String(255), nullable=True)
    icon         = Column(String(100), nullable=True)
    module       = Column(String(100), nullable=False, index=True)
    permission   = Column(String(100), nullable=True)
    sequence     = Column(Integer, nullable=False, default=0)
    parent_id    = Column(String(255), ForeignKey("tileflow_menus.id"), nullable=True)
    feature_flag = Column(String(100), nullable=True)
    badge        = Column(String(50), nullable=True)
