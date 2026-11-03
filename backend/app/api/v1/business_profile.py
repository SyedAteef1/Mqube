from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import TenantContext, get_company_db, get_db, get_tenant_context, require_role
from ...models.auth import User, UserRole
from ...models.tenant import Company
from ...schemas.business_profile import BusinessProfile, BusinessProfileUpdate

router = APIRouter()


@router.get("/profile", response_model=BusinessProfile)
async def get_business_profile(
    tenant_ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    company = await db.get(Company, tenant_ctx.company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found.")
    return company


@router.put("/profile", response_model=BusinessProfile)
async def update_business_profile(
    profile: BusinessProfileUpdate,
    tenant_ctx: TenantContext = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
    company_db: AsyncSession = Depends(get_company_db),
    _owner: User = Depends(require_role(UserRole.SYSADMIN)),
):
    """Tax is worked out from the company database and login reads the control database, so save both."""
    company = await db.get(Company, tenant_ctx.company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found.")
    company_copy = await company_db.get(Company, tenant_ctx.company_id)
    for row in filter(None, (company, company_copy)):
        for field, value in profile.model_dump().items():
            setattr(row, field, value)
    await company_db.commit()
    await db.commit()
    return company
