from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel


class MasterTypeCreate(BaseModel):
    code: str
    label: str
    field_schema: dict[str, Any]
    ui_schema: dict[str, Any] | None = None
    used_in_modules: list[str] | None = None
    depends_on: str | None = None
    version: int | None = 1
    evidence_level: str | None = 'D'
    created_by: str | None = None


class MasterTypeResponse(BaseModel):
    id: UUID
    code: str
    label: str
    field_schema: dict[str, Any]
    ui_schema: dict[str, Any] | None = None
    used_in_modules: list[str] | None = None
    depends_on: str | None = None
    version: int
    evidence_level: str
    created_by: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MasterValueCreate(BaseModel):
    code: str
    name: str
    parent_value_id: UUID | None = None
    data: dict[str, Any] | None = None
    active: bool | None = True
    sort_order: int | None = 0


class MasterValueUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    parent_value_id: UUID | None = None
    data: dict[str, Any] | None = None
    active: bool | None = None
    sort_order: int | None = None


class MasterValueResponse(BaseModel):
    id: UUID
    master_type_id: UUID
    code: str
    name: str
    parent_value_id: UUID | None = None
    data: dict[str, Any]
    active: bool
    sort_order: int
    updated_at: datetime

    model_config = {"from_attributes": True}
