"""Add the owner's business details that print on every bill."""

from alembic import op


revision = "v1397_company_business_profile"
down_revision = "v1396_tile_groups"
branch_labels = None
depends_on = None

COLUMNS = {
    "address": "TEXT",
    "phone": "VARCHAR(50)",
    "email": "VARCHAR(255)",
    "bank_name": "VARCHAR(255)",
    "bank_account_name": "VARCHAR(255)",
    "bank_account_no": "VARCHAR(50)",
    "bank_ifsc": "VARCHAR(20)",
    "bank_branch": "VARCHAR(255)",
}


def upgrade() -> None:
    for name, column_type in COLUMNS.items():
        op.execute(f"ALTER TABLE IF EXISTS companies ADD COLUMN IF NOT EXISTS {name} {column_type}")


def downgrade() -> None:
    for name in COLUMNS:
        op.execute(f"ALTER TABLE IF EXISTS companies DROP COLUMN IF EXISTS {name}")
