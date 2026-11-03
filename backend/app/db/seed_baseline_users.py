import asyncio
import json
import os
import uuid
from sqlalchemy import select
try:
    from app.db.session import async_session
    import app.models.role
    import app.models.auth
    import app.models.tenant
    import app.models.user_assignment
    import app.models.company_registry
    from app.models.auth import User, UserRole
    from app.models.role import Role
    from app.models.tenant import Company, Branch
    from app.models.company_registry import CompanyDatabaseRegistry
    from app.models.user_assignment import UserCompanyAssignment, UserBranchAssignment
    from app.core.security import hash_password
    from app.core.config import settings
    from app.models.inventory import LocationType, Warehouse
    from app.models.master_lookup import MasterType
    from app.services.item_taxonomy import ensure_lookup_value
except ImportError:
    from backend.app.db.session import async_session
    import backend.app.models.role
    import backend.app.models.auth
    import backend.app.models.tenant
    import backend.app.models.user_assignment
    import backend.app.models.company_registry
    from backend.app.models.auth import User, UserRole
    from backend.app.models.role import Role
    from backend.app.models.tenant import Company, Branch
    from backend.app.models.company_registry import CompanyDatabaseRegistry
    from backend.app.models.user_assignment import UserCompanyAssignment, UserBranchAssignment
    from backend.app.core.security import hash_password
    from backend.app.core.config import settings
    from backend.app.models.inventory import LocationType, Warehouse
    from backend.app.models.master_lookup import MasterType
    from backend.app.services.item_taxonomy import ensure_lookup_value


async def seed():
    async with async_session() as db:
        # 0. Ensure default system roles exist
        for r_name in ["SYSADMIN", "ADMIN", "MANAGER", "CASHIER", "SALES_EXECUTIVE"]:
            r_id = f"role-{r_name.lower()}"
            r = await db.get(Role, r_id)
            if not r:
                r = Role(
                    id=r_id,
                    name=r_name,
                    description=f"{r_name} role",
                    permissions_json=json.dumps(["*"]),
                    is_active=True,
                    is_system=True,
                )
                db.add(r)
        await db.flush()

        is_production = settings.ENVIRONMENT.strip().lower() in {"production", "prod"}

        # 1. Multiple Enterprise Companies with Branches & READY Registries
        enterprise_companies = [
            {
                "id": "COMP-001",
                "name": "MQube Tiles & Sanitaryware",
                "gst_number": "27AAXFT2508H1ZR",
                "db_name": "tileflow001",
                "branches": [
                    {"id": "BR-MAIN-001", "name": "Main Corporate Branch", "code": "MAIN"},
                    {"id": "BR-SOUTH-001", "name": "South Distribution Hub", "code": "SOUTH-01"},
                ]
            },
            {
                "id": "COMP-002",
                "name": "TILEFLOW Fashion & Lifestyle Hub",
                "gst_number": "27AABCS1429B1ZB",
                "db_name": "tileflow002",
                "branches": [
                    {"id": "BR-BND-001", "name": "Bandra Flagship Store", "code": "BANDRA-01"},
                    {"id": "BR-BKC-001", "name": "BKC Boutique Mall", "code": "BKC-01"},
                ]
            },
            {
                "id": "COMP-003",
                "name": "TILEFLOW Electronics & Digital Hyperstore",
                "gst_number": "27AABCS9988C1ZC",
                "db_name": "tileflow003",
                "branches": [
                    {"id": "BR-ADH-001", "name": "Andheri Mega Superstore", "code": "ANDHERI-01"},
                    {"id": "BR-THN-001", "name": "Thane Central Experience Center", "code": "THANE-01"},
                ]
            },
        ]

        if is_production:
            # Only the owner's company. GSTIN and business details are entered by the owner in Business Profile.
            enterprise_companies = [dict(enterprise_companies[0], gst_number=None)]

        for comp_def in enterprise_companies:
            # Company
            comp = await db.get(Company, comp_def["id"])
            if not comp:
                comp = Company(
                    id=comp_def["id"],
                    name=comp_def["name"],
                    gst_number=comp_def["gst_number"],
                    is_active=True,
                )
                db.add(comp)
            else:
                comp.is_active = True

            # Database Registry (READY)
            reg = await db.get(CompanyDatabaseRegistry, comp_def["id"])
            if not reg:
                reg = CompanyDatabaseRegistry(
                    company_id=comp_def["id"],
                    database_id=f"db-{comp_def['id'].lower()}",
                    database_name=comp_def["db_name"],
                    status="READY",
                )
                db.add(reg)
            else:
                reg.status = "READY"
                reg.database_name = comp_def["db_name"]

            # Branches
            for br_def in comp_def["branches"]:
                res_br = await db.execute(
                    select(Branch).where(
                        (Branch.id == br_def["id"]) | (Branch.code == br_def["code"])
                    )
                )
                br = res_br.scalars().first()
                if not br:
                    br = Branch(
                        id=br_def["id"],
                        company_id=comp_def["id"],
                        name=br_def["name"],
                        code=br_def["code"],
                        is_active=True,
                    )
                    db.add(br)
                else:
                    br.name = br_def["name"]
                    br.code = br_def["code"]
                    br.company_id = comp_def["id"]
                    br.is_active = True

        await db.flush()

        # 2. Users: admin, sysadmin, manager, cashier with standard hashes
        users_to_seed = [
            ("admin", "usr-admin", "admin@tileflow.in", "Admin@123", UserRole.SYSADMIN, "role-sysadmin", None, None),
            ("sysadmin", "usr-sysadmin-direct", "sysadmin_direct@tileflow.in", "Admin@123", UserRole.SYSADMIN, "role-sysadmin", None, None),
            ("usr_sysadmin", "usr-sysadmin", "sysadmin@tileflow.in", "Admin@123", UserRole.SYSADMIN, "role-sysadmin", None, None),
            ("usr_super", "usr-super", "super@tileflow.in", "Admin@123", UserRole.SYSADMIN, "role-sysadmin", None, None),
            ("manager", "usr-manager-direct", "manager@tileflow.in", "Manager@123", UserRole.MANAGER, "role-manager", "COMP-001", "BR-MAIN-001"),
            ("usr_manager", "usr-manager", "usr_manager@tileflow.in", "Manager@123", UserRole.MANAGER, "role-manager", "COMP-001", "BR-MAIN-001"),
            ("usr_store_manager_a", "usr-store-manager-a", "store_mgr_a@tileflow.in", "Manager@123", UserRole.MANAGER, "role-manager", "COMP-001", "BR-MAIN-001"),
            ("cashier", "usr-cashier-direct", "cashier@tileflow.in", "Cashier@123", UserRole.CASHIER, "role-cashier", "COMP-001", "BR-MAIN-001"),
            ("usr_cashier", "usr-cashier", "usr_cashier@tileflow.in", "Cashier@123", UserRole.CASHIER, "role-cashier", "COMP-001", "BR-MAIN-001"),
        ]

        # Production: never create the demo accounts and never reset an existing password.
        # Only the owner's admin account is created, once, from the MQUBE_ADMIN_PASSWORD secret.
        if is_production:
            admin_password = os.getenv("MQUBE_ADMIN_PASSWORD", "")
            if len(admin_password) < 12:
                raise RuntimeError("MQUBE_ADMIN_PASSWORD (12+ characters) is required to create the first admin in production.")
            users_to_seed = [
                ("admin", "usr-admin", os.getenv("MQUBE_ADMIN_EMAIL", "admin@mqube.local"), admin_password,
                 UserRole.SYSADMIN, "role-sysadmin", None, None),
            ]

        for uname, target_id, email, pwd, role_enum, role_id, comp_id, target_branch_code in users_to_seed:
            
            # Resolve actual branch ID in database
            actual_branch_id = None
            if comp_id:
                res_b = await db.execute(
                    select(Branch).where(
                        (Branch.company_id == comp_id) & 
                        ((Branch.id == target_branch_code) | (Branch.code == target_branch_code) | (Branch.code == "MAIN") | (Branch.id == "MAIN"))
                    )
                )
                b_match = res_b.scalars().first()
                if b_match:
                    actual_branch_id = b_match.id

            res = await db.execute(
                select(User).where((User.username == uname) | (User.id == target_id))
            )
            u = res.scalars().first()
            if not u:
                u = User(
                    id=target_id,
                    username=uname,
                    email=email,
                    hashed_password=hash_password(pwd),
                    role=role_enum,
                    role_id=role_id,
                    is_active=True,
                    is_deleted=False,
                    company_id=comp_id,
                    branch_id=actual_branch_id,
                    status="Active",
                )
                db.add(u)
                await db.flush()
            elif is_production:
                pass  # existing account: leave password, role and status exactly as the owner set them
            else:
                u.username = uname
                u.email = email
                u.hashed_password = hash_password(pwd)
                u.role = role_enum
                u.role_id = role_id
                u.is_active = True
                u.is_deleted = False
                u.status = "Active"
                if comp_id:
                    u.company_id = comp_id
                u.branch_id = actual_branch_id

            # Assign all 3 companies to sysadmin roles, and COMP-001 to manager and cashier
            target_comps = ["COMP-001", "COMP-002", "COMP-003"] if role_enum == UserRole.SYSADMIN and not is_production else ["COMP-001"]
            for target_c in target_comps:
                res_uca = await db.execute(
                    select(UserCompanyAssignment).where(
                        UserCompanyAssignment.user_id == u.id,
                        UserCompanyAssignment.company_id == target_c,
                    )
                )
                if not res_uca.scalars().first():
                    db.add(
                        UserCompanyAssignment(
                            id=f"uca-{u.id}-{target_c.lower()}",
                            user_id=u.id,
                            company_id=target_c,
                            is_default=(target_c == "COMP-001"),
                            is_active=True,
                            is_deleted=False,
                        )
                    )

        # 3. Seed baseline customer groups and active customers for billing
        try:
            from app.models.crm import CustomerGroup, Customer
        except ImportError:
            from backend.app.models.crm import CustomerGroup, Customer

        # 3. Seed baseline customer groups and active customers for billing
        try:
            from app.models.crm import CustomerGroup, Customer
            from app.db.session import get_company_sessionmaker
        except ImportError:
            from backend.app.models.crm import CustomerGroup, Customer
            from backend.app.db.session import get_company_sessionmaker

        async def _seed_crm_data(target_session, comp_id="COMP-001"):
            cg_retail = await target_session.get(CustomerGroup, "CG-Retail")
            if not cg_retail:
                cg_retail = CustomerGroup(
                    id="CG-Retail",
                    name="Retail Clients",
                    credit_limit=100000.00,
                    credit_days=30,
                    company_id=comp_id,
                    branch_id=None
                )
                target_session.add(cg_retail)

            cg_corp = await target_session.get(CustomerGroup, "CG-Corporate")
            if not cg_corp:
                cg_corp = CustomerGroup(
                    id="CG-Corporate",
                    name="Corporate Clients",
                    credit_limit=500000.00,
                    credit_days=60,
                    company_id=comp_id,
                    branch_id=None
                )
                target_session.add(cg_corp)

            cg_large = await target_session.get(CustomerGroup, "CG-LargeRetail")
            if not cg_large:
                cg_large = CustomerGroup(
                    id="CG-LargeRetail",
                    name="Large-Format Retail",
                    credit_limit=1000000.00,
                    credit_days=90,
                    company_id=comp_id,
                    branch_id=None
                )
                target_session.add(cg_large)
            await target_session.flush()

            baseline_customers = [
                {
                    "id": "CUST-001",
                    "code": "CUST-001",
                    "name": "Reliance Retail Limited",
                    "mobile": "9822334455",
                    "email": "operations@relianceretail.com",
                    "gst_number": "29AABCR1718E1ZL",
                    "customer_group_id": "CG-LargeRetail",
                    "outstanding": 180000.00,
                    "company_id": comp_id,
                    "branch_id": None
                },
                {
                    "id": "CUST-002",
                    "code": "CUST-002",
                    "name": "Shoppers Stop Ltd",
                    "mobile": "9833445566",
                    "email": "billing@shoppersstop.com",
                    "gst_number": "27AAACS4321E1Z2",
                    "customer_group_id": "CG-LargeRetail",
                    "outstanding": 250000.00,
                    "company_id": comp_id,
                    "branch_id": None
                },
                {
                    "id": "CUST-003",
                    "code": "CUST-003",
                    "name": "Lifestyle International",
                    "mobile": "9844556677",
                    "email": "accounts@lifestylestores.com",
                    "gst_number": "27AAACL5678A1Z3",
                    "customer_group_id": "CG-Corporate",
                    "outstanding": 120000.00,
                    "company_id": comp_id,
                    "branch_id": None
                },
                {
                    "id": "CUST-WALKIN",
                    "code": "WALK-IN",
                    "name": "Walk-In / Cash Customer",
                    "mobile": "9999999999",
                    "customer_group_id": "CG-Retail",
                    "outstanding": 0.00,
                    "company_id": comp_id,
                    "branch_id": None
                }
            ]

            if is_production:
                # No sample customers or made-up outstanding balances on a live system.
                baseline_customers = [c for c in baseline_customers if c["id"] == "CUST-WALKIN"]
                for c in baseline_customers:
                    c["mobile"] = None

            for cust_data in baseline_customers:
                c = await target_session.get(Customer, cust_data["id"])
                if not c:
                    c = Customer(**cust_data)
                    target_session.add(c)
                else:
                    for k, v in cust_data.items():
                        setattr(c, k, v)
            await target_session.commit()

        async def _seed_starter_masters(company_db, comp_id, branch_code):
            """A new company needs at least one showroom and one godown before stock can come in."""
            existing = await company_db.execute(select(Warehouse.id).where(Warehouse.company_id == comp_id))
            if existing.first() is None:
                for wh_id, code, name, loc_type in (
                    ("WH-SHOWROOM", "SHOWROOM", "Main Showroom", LocationType.SHOWROOM),
                    ("WH-GODOWN", "GODOWN", "Main Godown", LocationType.GODOWN),
                ):
                    company_db.add(Warehouse(id=wh_id, uuid=str(uuid.uuid4()), code=code, name=name,
                                             location_type=loc_type.value, company_id=comp_id, branch_id=branch_code))

        # Item Master only accepts categories and brands that exist in the Master Registry.
        for category in ("Floor Tiles", "Wall Tiles", "Parking Tiles", "Sanitaryware"):
            await ensure_lookup_value(db, "category", "Category", category)
        if not (await db.execute(select(MasterType.id).where(MasterType.code == "brand"))).first():
            db.add(MasterType(code="brand", label="Brand", field_schema={}))
        await db.flush()

        # Seed into control DB
        await _seed_crm_data(db, "COMP-001")

        # Seed into tenant company DBs
        company_dbs = ["tileflow001"] if is_production else ["tileflow001", "tileflow002", "tileflow003"]
        for comp_db in company_dbs:
            try:
                comp_sm = get_company_sessionmaker(comp_db)
                async with comp_sm() as cdb:
                    # The company DB keeps its own copy of the company and branch rows (foreign keys need them).
                    owner_def = next((c for c in enterprise_companies if c["db_name"] == comp_db), None)
                    if owner_def:
                        src_company = await db.get(Company, owner_def["id"])
                        if src_company and not await cdb.get(Company, owner_def["id"]):
                            cdb.add(Company(id=src_company.id, name=src_company.name,
                                            gst_number=src_company.gst_number, is_active=True))
                            await cdb.flush()
                        # Tenant requests carry the branch code, so the company DB keys branches by code.
                        for br_def in owner_def["branches"]:
                            if not await cdb.get(Branch, br_def["code"]):
                                cdb.add(Branch(id=br_def["code"], company_id=owner_def["id"],
                                               name=br_def["name"], code=br_def["code"], is_active=True))
                        await cdb.flush()
                        await _seed_starter_masters(cdb, owner_def["id"], owner_def["branches"][0]["code"])
                        await cdb.commit()
                    await _seed_crm_data(cdb, "COMP-001")
            except Exception as e:
                print(f"Notice: seeding into company db {comp_db}: {e}")

        print("SUCCESS: Seeded Enterprise Companies with READY database registries, authenticated users, and CRM customers across all databases!")


if __name__ == "__main__":
    asyncio.run(seed())
