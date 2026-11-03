"""The owner creates staff from the Staff Master form (no branch ID, no email); each one must be able to sign in."""
import uuid

from httpx import ASGITransport, AsyncClient

from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.auth import User, UserRole
from app.models.tenant import Branch, Company


async def _owner(db_session, suffix):
    company = Company(id=f"comp-staff-{suffix}", name=f"Staff Co {suffix}", is_active=True)
    branch = Branch(id=f"br-staff-{suffix}", company_id=company.id, name="Main Branch", code=f"MAIN{suffix}", is_active=True)
    owner = User(
        id=f"usr-owner-{suffix}", username=f"owner_{suffix}", email=None,
        hashed_password=hash_password("Owner@12345"), role=UserRole.SYSADMIN,
        is_active=True, is_deleted=False, status="Active",
    )
    db_session.add_all([company, branch, owner])
    await db_session.commit()
    token = create_access_token({
        "sub": owner.id, "username": owner.username, "role": "SYSADMIN",
        "company_id": company.id, "branch_id": branch.id, "jti": str(uuid.uuid4()), "type": "access",
    })
    return company, branch, token


async def test_staff_created_from_form_can_sign_in(db_session):
    suffix = uuid.uuid4().hex[:6]
    company, branch, token = await _owner(db_session, suffix)
    headers = {"Authorization": f"Bearer {token}", "X-Company-ID": company.id}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for name in ("a", "b"):  # two staff without email must both save
            res = await client.post("/api/v1/users/", headers=headers, json={
                "username": f"cash{name}_{suffix}", "fullName": f"Cashier {name}", "role": "CASHIER",
                "passwordHash": "Counter@1234",
            })
            assert res.status_code == 201, res.text

        login = await client.post("/api/v1/auth/login", json={"username": f"casha_{suffix}", "password": "Counter@1234"})
        assert login.status_code == 200, login.text



async def test_staff_needs_a_real_password(db_session):
    suffix = uuid.uuid4().hex[:6]
    company, _, token = await _owner(db_session, suffix)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/v1/users/", headers={"Authorization": f"Bearer {token}", "X-Company-ID": company.id},
                                json={"username": f"nopw_{suffix}", "fullName": "No Password", "role": "CASHIER"})
    assert res.status_code == 422
