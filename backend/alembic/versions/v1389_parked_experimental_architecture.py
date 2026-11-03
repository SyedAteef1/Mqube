from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'v1389_park'
down_revision = 'v1388_plat'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This migration documents parked experimental architecture.
    # No DDL operations are performed.
    # See ARCHITECTURE_DECISIONS.md for details on physically-isolated-company-dbs feature branch.
    pass


def downgrade() -> None:
    # No DDL operations to reverse.
    pass
