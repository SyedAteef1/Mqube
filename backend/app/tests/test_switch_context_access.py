from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.models.auth import UserRole
from app.schemas.auth import TenantContextSwitchRequest
from app.services.auth import AuthService


class FakeDb:
    def __init__(self, *rows):
        self.rows = list(rows)

    async def execute(self, _query):
        rows = self.rows.pop(0)
        return SimpleNamespace(scalars=lambda: SimpleNamespace(all=lambda: rows))


def _user():
    return SimpleNamespace(
        id="u1", username="cashier", role=UserRole.CASHIER, company_id="COMP-001", branch_id="BR-MAIN-001",
        status="Active",
    )


def _req(company="COMP-001", branch="BR-MAIN-001"):
    return TenantContextSwitchRequest(target_company_id=company, target_branch_id=branch)


async def _check(req, company_rows, branch_rows):
    await AuthService(FakeDb(company_rows, branch_rows))._verify_context_access(_user(), req)


@pytest.mark.asyncio
async def test_user_without_branch_rows_can_enter_home_branch():
    await _check(_req(), ["COMP-001"], [])


@pytest.mark.asyncio
async def test_user_without_any_rows_can_enter_home_scope():
    await _check(_req(), [], [])


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "req_args, company_rows, branch_rows",
    [
        (("COMP-001", "BR-SOUTH-001"), ["COMP-001"], []),  # another branch of the home company
        (("COMP-002", "BR-MAIN-001"), ["COMP-001", "COMP-002"], []),  # home branch id under another company
        (("COMP-002", "BR-X"), ["COMP-001"], []),  # unassigned company
        (("COMP-002", "BR-X"), [], []),  # no rows never opens another company
        (("COMP-001", "BR-MAIN-001"), ["COMP-001"], ["BR-SOUTH-001"]),  # explicit rows replace the home branch
    ],
)
async def test_access_outside_permitted_scope_is_refused(req_args, company_rows, branch_rows):
    with pytest.raises(HTTPException) as err:
        await _check(_req(*req_args), company_rows, branch_rows)
    assert err.value.status_code == 403
