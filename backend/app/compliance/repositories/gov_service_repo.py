from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TenantContext
from app.compliance.models.compliance import GovernmentService
from app.repositories.base import BaseRepository


class GovernmentServiceRepository(BaseRepository[GovernmentService]):
    """
    Repository for managing GovernmentService persistence logic.
    """
    def __init__(self, db: AsyncSession, tenant_ctx: TenantContext | None = None):
        super().__init__(GovernmentService, db, tenant_ctx)
