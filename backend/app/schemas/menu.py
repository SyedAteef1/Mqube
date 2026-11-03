from typing import List, Optional
from pydantic import BaseModel, Field

class TileFlowMenuBase(BaseModel):
    title: str
    route: Optional[str] = None
    icon: Optional[str] = None
    module: str
    permission: Optional[str] = None
    sequence: int = 0
    parent_id: Optional[str] = None
    feature_flag: Optional[str] = None
    badge: Optional[str] = None
    is_active: bool = True

class TileFlowMenuCreate(TileFlowMenuBase):
    id: str

class TileFlowMenuUpdate(BaseModel):
    title: Optional[str] = None
    route: Optional[str] = None
    icon: Optional[str] = None
    module: Optional[str] = None
    permission: Optional[str] = None
    sequence: Optional[int] = None
    parent_id: Optional[str] = None
    is_active: Optional[bool] = None

class TileFlowMenuResponse(TileFlowMenuBase):
    id: str
    uuid: str
    company_id: Optional[str] = None
    branch_id: Optional[str] = None

    class Config:
        from_attributes = True

class MenuNode(TileFlowMenuResponse):
    children: List["MenuNode"] = Field(default_factory=list)

MenuNode.model_rebuild()
