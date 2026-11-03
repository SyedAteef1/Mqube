from sqlalchemy import (
    Column, String, Integer, SmallInteger, Text,
    UniqueConstraint, CheckConstraint
)
from sqlalchemy.orm import relationship
from ..db.base import BaseEntity


class LegacyMenuMap(BaseEntity):
    """
    Maps every Shoper9 vaMenu entry (MnuNo, MenuOpt) to its
    canonical TILEFLOW workspace + action equivalent.

    Table: tileflow_legacy_menu_map
    """
    __tablename__ = "tileflow_legacy_menu_map"
    __table_args__ = (
        UniqueConstraint("sh9_mnu_no", "sh9_menu_opt",
                         name="uq_legacy_map_mnu_opt"),
        CheckConstraint(
            "migration_status IN ("
            "'MAPPED','MERGED','REPLACED','DEPRECATED','NOT_APPLIC','PENDING')",
            name="ck_legacy_map_status"
        ),
        CheckConstraint(
            "sh9_mnu_no >= 0 AND sh9_menu_opt >= 0",
            name="ck_legacy_map_nonneg"
        ),
    )

    # ── Shoper9 Identity (natural keys from vaMenu) ───────────────────────────
    sh9_mnu_no   = Column(Integer, nullable=False, index=True,
                          comment="vaMenu.MnuNo -- Shoper parent group code")
    sh9_menu_opt = Column(Integer, nullable=False, index=True,
                          comment="vaMenu.MenuOpt -- Shoper leaf action code")
    sh9_mnu_name = Column(String(120), nullable=True,
                          comment="vaMenu.MnuName -- Shoper group label")
    sh9_mnu_cap  = Column(String(200), nullable=True,
                          comment="vaMenu.MnuCap -- Shoper display caption")
    sh9_exe_name = Column(String(60), nullable=True,
                          comment="vaMenu.ExeName -- Shoper executable")
    sh9_pgm_opt  = Column(SmallInteger, nullable=True,
                          comment="vaMenu.pgmopt -- Shoper sub-function code")
    sh9_allow_closed = Column(SmallInteger, nullable=True, default=0,
                              comment="vaMenu.AllowWhenTrnClosed flag")
    sh9_multi_inst   = Column(SmallInteger, nullable=True, default=0,
                              comment="vaMenu.MultiInstance flag")

    # ── TILEFLOW Target (resolved from CANONICAL_34_MENU_MATRIX) ───────────────
    tileflow_menu_id   = Column(String(80), nullable=True, index=True,
                              comment="TILEFLOW menu_id key from canonical matrix")
    tileflow_workspace = Column(String(120), nullable=True,
                              comment="Human-readable TILEFLOW workspace name")
    tileflow_module    = Column(String(50), nullable=True, index=True,
                              comment="TILEFLOW functional module: SALES/INVENTORY/etc")
    tileflow_action    = Column(String(60), nullable=True,
                              comment="TILEFLOW action verb: NEW_TRANSACTION/VIEW/etc")
    document_type    = Column(String(60), nullable=True,
                              comment="TILEFLOW document_type routing label")

    # ── Migration Governance ──────────────────────────────────────────────────
    migration_status = Column(
        String(20), nullable=False, default="PENDING", index=True,
        comment=(
            "MAPPED=direct equiv | MERGED=consolidated | "
            "REPLACED=TILEFLOW-superior | DEPRECATED=pre-GST/Tally | "
            "NOT_APPLIC=internal Shoper infra | PENDING=needs review"
        )
    )
    migration_notes  = Column(Text, nullable=True,
                              comment="Free-text rationale for classification")

    # ── Source Traceability ───────────────────────────────────────────────────
    source_file      = Column(String(120), nullable=True,
                              comment="S9Q source file this entry was extracted from")
    map_version      = Column(String(10), nullable=False, default="1.0",
                              comment="Sprint that produced this mapping")

    def __repr__(self) -> str:
        return (
            f"<LegacyMenuMap sh9=({self.sh9_mnu_no},{self.sh9_menu_opt}) "
            f"tileflow={self.tileflow_menu_id} action={self.tileflow_action} "
            f"status={self.migration_status}>"
        )
