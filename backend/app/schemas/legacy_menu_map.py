from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


# ── Response Schemas ──────────────────────────────────────────────────────────

class LegacyMenuItemResponse(BaseModel):
    """
    Single tileflow_legacy_menu_map record.
    Represents one Shoper9 vaMenu entry and its TILEFLOW mapping.
    """
    id:              str
    uuid:            str

    # Shoper9 identity
    sh9_mnu_no:      int   = Field(..., description="Shoper parent group code (MnuNo)")
    sh9_menu_opt:    int   = Field(..., description="Shoper leaf action code (MenuOpt)")
    sh9_mnu_name:    Optional[str] = Field(None, description="Shoper group label (MnuName)")
    sh9_mnu_cap:     Optional[str] = Field(None, description="Shoper display caption (MnuCap)")
    sh9_exe_name:    Optional[str] = Field(None, description="Shoper executable (ExeName)")
    sh9_pgm_opt:     Optional[int] = Field(None, description="Shoper sub-function code (pgmopt)")
    sh9_allow_closed:Optional[int] = Field(None, description="AllowWhenTrnClosed flag")
    sh9_multi_inst:  Optional[int] = Field(None, description="MultiInstance flag")

    # TILEFLOW target
    tileflow_menu_id:   Optional[str] = Field(None, description="TILEFLOW canonical menu_id")
    tileflow_workspace: Optional[str] = Field(None, description="TILEFLOW workspace name")
    tileflow_module:    Optional[str] = Field(None, description="TILEFLOW functional module")
    tileflow_action:    Optional[str] = Field(None, description="TILEFLOW action verb")
    document_type:    Optional[str] = Field(None, description="TILEFLOW document_type routing label")

    # Migration governance
    migration_status: str  = Field(..., description=(
        "MAPPED | MERGED | REPLACED | DEPRECATED | NOT_APPLIC | PENDING"
    ))
    migration_notes:  Optional[str] = Field(None, description="Classification rationale")
    map_version:      str  = Field(..., description="Sprint version that produced this mapping")

    # Audit
    source_file:  Optional[str] = None
    created_at:   Optional[datetime] = None
    modified_at:  Optional[datetime] = None

    class Config:
        from_attributes = True


class LegacyMenuSummary(BaseModel):
    """
    Lightweight summary row — for list views and pagination.
    """
    id:              str
    sh9_mnu_no:      int
    sh9_menu_opt:    int
    sh9_mnu_cap:     Optional[str] = None
    sh9_exe_name:    Optional[str] = None
    tileflow_menu_id:  Optional[str] = None
    tileflow_workspace:Optional[str] = None
    tileflow_action:   Optional[str] = None
    migration_status:str

    class Config:
        from_attributes = True


class LegacyMenuStats(BaseModel):
    """
    Aggregate status breakdown for the migration dashboard.
    """
    total:       int
    mapped:      int
    merged:      int
    replaced:    int
    deprecated:  int
    not_applic:  int
    pending:     int
    coverage_pct: float = Field(..., description="(total - pending) / total * 100")

    # Module breakdown
    modules: dict = Field(default_factory=dict,
                          description="module -> count of MAPPED entries")

    # MultiInstance flag summary
    multi_instance_count: int = Field(
        0, description="Entries requiring concurrent multi-tab session support"
    )


class LegacyMenuListResponse(BaseModel):
    """
    Paginated list wrapper.
    """
    total:   int
    page:    int
    size:    int
    pages:   int
    items:   list[LegacyMenuSummary]
