from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TenantContext
from app.compliance.models.compliance import ComplianceAuditLog
from app.repositories.base import BaseRepository


class ComplianceAuditLogRepository(BaseRepository[ComplianceAuditLog]):
    """
    Repository for managing ComplianceAuditLog persistence logic.
    """
    def __init__(self, db: AsyncSession, tenant_ctx: TenantContext | None = None):
        super().__init__(ComplianceAuditLog, db, tenant_ctx)
