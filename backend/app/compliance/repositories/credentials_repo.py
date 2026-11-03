from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import TenantContext
from app.compliance.models.compliance import ComplianceCredentials
from app.repositories.base import BaseRepository


class ComplianceCredentialsRepository(BaseRepository[ComplianceCredentials]):
    """
    Repository for managing ComplianceCredentials persistence logic.
    """
    def __init__(self, db: AsyncSession, tenant_ctx: TenantContext | None = None):
        super().__init__(ComplianceCredentials, db, tenant_ctx)

    async def get_by_service(self, service_id: str) -> ComplianceCredentials | None:
        """
        Retrieves active credentials by compliance service identifier.
        """
        stmt = select(self.model).filter(
            self.model.service_id == service_id,
            self.model.is_deleted.is_(False)
        )
        stmt = self._apply_tenant_filter(stmt)
        result = await self.db.execute(stmt)
        return result.scalars().first()
