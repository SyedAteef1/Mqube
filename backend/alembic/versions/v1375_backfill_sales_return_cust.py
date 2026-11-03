from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "v1375_backfill_sales_return_cust"
down_revision = "v1374_sales_return_cust"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Back-fill sales_returns.customer_id from original sales_invoices."""
    op.execute(
        """
        UPDATE sales_returns sr
        SET    customer_id = si.customer_id
        FROM   sales_invoices si
        WHERE  sr.original_invoice_id = si.id
          AND  sr.customer_id IS NULL
          AND  si.customer_id IS NOT NULL
        """
    )


def downgrade() -> None:
    """
    No-op downgrade.
    The customer_id column itself was created in v1374; we do not drop
    back-filled data on downgrade as it is non-destructive metadata.
    To fully revert, downgrade to v1374 which will handle the column removal.
    """
    pass
