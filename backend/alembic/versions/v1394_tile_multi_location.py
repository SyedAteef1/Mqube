"""Add showroom/godown location types, tile attributes and Sq.Ft. invoice lines."""

from alembic import op


revision = "v1394_tile_multi_location"
down_revision = "v1393_product_type_dimension"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE IF EXISTS warehouses "
        "ADD COLUMN IF NOT EXISTS location_type VARCHAR(20) NOT NULL DEFAULT 'GODOWN'"
    )
    op.execute("ALTER TABLE IF EXISTS warehouses DROP CONSTRAINT IF EXISTS ck_warehouses_location_type")
    op.execute(
        "ALTER TABLE IF EXISTS warehouses ADD CONSTRAINT ck_warehouses_location_type "
        "CHECK (location_type IN ('SHOWROOM', 'GODOWN'))"
    )

    op.execute(
        "ALTER TABLE IF EXISTS products "
        "ADD COLUMN IF NOT EXISTS sqft_per_box NUMERIC(10, 4), "
        "ADD COLUMN IF NOT EXISTS pieces_per_box INTEGER, "
        "ADD COLUMN IF NOT EXISTS batch_shade_no VARCHAR(100), "
        "ADD COLUMN IF NOT EXISTS caliber_code VARCHAR(50)"
    )
    # New products only: existing rows keep the HSN they were saved with.
    op.execute("ALTER TABLE IF EXISTS products ALTER COLUMN hsn_code SET DEFAULT '6907'")

    op.execute(
        "ALTER TABLE IF EXISTS sales_invoice_items "
        "ADD COLUMN IF NOT EXISTS sqft_requested NUMERIC(12, 4), "
        "ADD COLUMN IF NOT EXISTS sqft_per_box NUMERIC(10, 4), "
        "ADD COLUMN IF NOT EXISTS sqft_billed NUMERIC(12, 4)"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE IF EXISTS sales_invoice_items "
        "DROP COLUMN IF EXISTS sqft_billed, "
        "DROP COLUMN IF EXISTS sqft_per_box, "
        "DROP COLUMN IF EXISTS sqft_requested"
    )
    op.execute("ALTER TABLE IF EXISTS products ALTER COLUMN hsn_code SET DEFAULT '6403'")
    op.execute(
        "ALTER TABLE IF EXISTS products "
        "DROP COLUMN IF EXISTS caliber_code, "
        "DROP COLUMN IF EXISTS batch_shade_no, "
        "DROP COLUMN IF EXISTS pieces_per_box, "
        "DROP COLUMN IF EXISTS sqft_per_box"
    )
    op.execute("ALTER TABLE IF EXISTS warehouses DROP CONSTRAINT IF EXISTS ck_warehouses_location_type")
    op.execute("ALTER TABLE IF EXISTS warehouses DROP COLUMN IF EXISTS location_type")
