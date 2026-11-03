revision      = "v1373_sales_invoice_ext"
down_revision = "v1372_sprint12_parity_tables"
branch_labels = None
depends_on    = None

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Add missing columns to sales_invoices (idempotent -- IF NOT EXISTS via try/except)
    with op.batch_alter_table("sales_invoices") as batch_op:
        batch_op.add_column(sa.Column(
            "salesperson_id", sa.String(50), nullable=True
        ))
        batch_op.add_column(sa.Column(
            "salesperson_name", sa.String(255), nullable=True
        ))
        batch_op.add_column(sa.Column(
            "discount_amount", sa.Numeric(15, 2),
            nullable=False, server_default="0"
        ))
        batch_op.add_column(sa.Column(
            "net_amount", sa.Numeric(15, 2),
            nullable=False, server_default="0"
        ))
        batch_op.add_column(sa.Column(
            "terminal_id", sa.String(50), nullable=True
        ))
        batch_op.add_column(sa.Column(
            "counter_id", sa.String(50), nullable=True
        ))
        batch_op.add_column(sa.Column(
            "paid_amount", sa.Numeric(15, 2),
            nullable=False, server_default="0"
        ))
        batch_op.add_column(sa.Column(
            "balance_amount", sa.Numeric(15, 2),
            nullable=False, server_default="0"
        ))

    # Index salesperson for report queries
    op.create_index(
        "ix_sales_invoices_salesperson",
        "sales_invoices", ["salesperson_id"]
    )
    op.create_index(
        "ix_sales_invoices_terminal",
        "sales_invoices", ["terminal_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_sales_invoices_terminal", "sales_invoices")
    op.drop_index("ix_sales_invoices_salesperson", "sales_invoices")
    with op.batch_alter_table("sales_invoices") as batch_op:
        batch_op.drop_column("balance_amount")
        batch_op.drop_column("paid_amount")
        batch_op.drop_column("counter_id")
        batch_op.drop_column("terminal_id")
        batch_op.drop_column("net_amount")
        batch_op.drop_column("discount_amount")
        batch_op.drop_column("salesperson_name")
        batch_op.drop_column("salesperson_id")
