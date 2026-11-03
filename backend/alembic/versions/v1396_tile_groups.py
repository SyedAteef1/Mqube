"""Add tile groups so stock can be counted per group."""

from alembic import op


revision = "v1396_tile_groups"
down_revision = "v1395_orm_column_parity"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS tile_groups (
            id VARCHAR(50) PRIMARY KEY,
            uuid VARCHAR(36) NOT NULL UNIQUE,
            company_id VARCHAR(50) REFERENCES companies(id) ON DELETE RESTRICT,
            branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE RESTRICT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE,
            modified_at TIMESTAMP WITH TIME ZONE,
            created_by VARCHAR(100),
            updated_by VARCHAR(100),
            is_active BOOLEAN DEFAULT TRUE,
            is_deleted BOOLEAN DEFAULT FALSE,
            deleted_at TIMESTAMP WITH TIME ZONE,
            deleted_by VARCHAR(100),
            version INTEGER DEFAULT 1
        )
        """
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_company_tile_group_active "
        "ON tile_groups (company_id, lower(name)) WHERE is_deleted = false"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS tile_groups")
