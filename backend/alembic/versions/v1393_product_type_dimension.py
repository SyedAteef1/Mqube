"""Add a distinct Product Type dimension to tenant products."""

from alembic import op


revision = "v1393_product_type_dimension"
down_revision = "v1392_users_column_widths"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE IF EXISTS products "
        "ADD COLUMN IF NOT EXISTS product_type VARCHAR(100)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_products_product_type "
        "ON products (product_type)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_products_product_type")
    op.execute(
        "ALTER TABLE IF EXISTS products DROP COLUMN IF EXISTS product_type"
    )
