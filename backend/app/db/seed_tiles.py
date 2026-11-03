"""
Idempotent local demo data for a tile business, for development only.

Run after `alembic upgrade head` on tileflowsys and tileflow001 and after
seed_baseline_users:  python -m app.db.seed_tiles
"""

import asyncio
import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.engine import make_url

from app.core.config import settings
from app.models import *  # noqa: F401,F403
from app.models.commission import CommissionParticipant
from app.models.crm import Customer
from app.models.inventory import LocationType, Product, ProductBatchStock, Warehouse
from app.models.tenant import Branch, Company
from app.services.item_taxonomy import ensure_lookup_value

COMPANY_ID = "COMP-001"
COMPANY_NAME = "MQube Tiles & Sanitaryware"
# Tenant requests carry the branch code, so the company DB keys this branch by code.
BRANCH_ID = "MAIN"

LOCATIONS = [
    ("WH-SHOWROOM", "SHOWROOM", "Main Showroom", LocationType.SHOWROOM),
    ("WH-GODOWN", "GODOWN", "Central Godown", LocationType.GODOWN),
    ("WH-GODOWN-2", "GODOWN-2", "East Godown", LocationType.GODOWN),
]

# code, name, category, brand, size, price per box, sqft/box, pieces/box, shade, caliber, hsn
TILES = [
    ("TL-GVT-6060-CRM", "Crema Marfil GVT 600x600", "Floor Tiles", "Kajaria", "600x600mm", "1150", "15.50", 4, "SH-A12", "C2", "6907"),
    ("TL-GVT-8080-STA", "Statuario GVT 800x800", "Floor Tiles", "Somany", "800x800mm", "1980", "20.67", 3, "SH-B07", "C1", "6907"),
    ("TL-WAL-3060-IVY", "Ivory Gloss Wall 300x600", "Wall Tiles", "Orient Bell", "300x600mm", "720", "15.50", 8, "SH-C03", "C3", "6907"),
    ("TL-PKG-3030-GRY", "Grey Anti-Skid Parking 300x300", "Parking Tiles", "Kajaria", "300x300mm", "540", "10.76", 10, "SH-D21", "C2", "6907"),
    ("SW-WC-EWC-WHT", "Wall-Hung EWC White", "Sanitaryware", "Hindware", "Standard", "8900", None, None, None, None, "6910"),
]
OPENING = {"WH-GODOWN": 500, "WH-SHOWROOM": 20}

CUSTOMERS = [
    ("CUST-TILE-MH", "Shree Builders (Maharashtra)", "9820000001", "27AABCS1234F1Z5"),
    ("CUST-TILE-KA", "Namma Interiors (Karnataka)", "9845000002", "29AABCN5678G1Z2"),
]


SALES_PEOPLE = [("SP-RAVI", "Ravi Kumar"), ("SP-ANITA", "Anita Desai")]


def _url(db_name: str):
    return make_url(settings.DATABASE_URL).set(database=db_name)


async def _upsert(session: AsyncSession, model, row_id: str, **values) -> None:
    row = await session.get(model, row_id)
    if row:
        for key, value in values.items():
            setattr(row, key, value)
    else:
        session.add(model(id=row_id, uuid=str(uuid.uuid4()), **values))


async def seed() -> None:
    control_engine = create_async_engine(_url("tileflowsys"))
    company_engine = create_async_engine(_url("tileflow001"))

    async with AsyncSession(control_engine) as control:
        company = await control.get(Company, COMPANY_ID)
        if company is None:
            raise SystemExit("Run app.db.seed_baseline_users first.")
        company_name = company.name
        gst_number = company.gst_number
        for tile in TILES:
            await ensure_lookup_value(control, "category", "Category", tile[2])
            await ensure_lookup_value(control, "brand", "Brand", tile[3])
        await control.commit()

    async with AsyncSession(company_engine) as db:
        await _upsert(db, Company, COMPANY_ID, name=company_name, gst_number=gst_number)
        await db.flush()
        await _upsert(db, Branch, BRANCH_ID, company_id=COMPANY_ID, name="Main Branch", code=BRANCH_ID)
        await db.flush()

        scope = {"company_id": COMPANY_ID, "branch_id": BRANCH_ID}
        for location_id, code, name, location_type in LOCATIONS:
            await _upsert(db, Warehouse, location_id, code=code, name=name, location_type=location_type.value, **scope)
        for customer_id, name, mobile, gstin in CUSTOMERS:
            await _upsert(db, Customer, customer_id, code=customer_id, name=name, mobile=mobile, gst_number=gstin, **scope)
        for person_id, person_name in SALES_PEOPLE:
            await _upsert(
                db, CommissionParticipant, person_id,
                person_name=person_name, roles=["SALESPERSON"], **scope,
            )
        await db.flush()

        for code, name, category, brand, size, price, sqft, pieces, shade, caliber, hsn in TILES:
            price_value = Decimal(price)
            await _upsert(
                db, Product, code,
                code=code, name=name, category=category, brand=brand, size=size,
                price=price_value, mrp=price_value, gst_percentage=Decimal("18.00"),
                buying_price=(price_value * Decimal("0.7")).quantize(Decimal("0.01")),
                cost_price=(price_value * Decimal("0.7")).quantize(Decimal("0.01")),
                barcode=code, sku=code, hsn_code=hsn,
                stock=sum(OPENING.values()),
                sqft_per_box=Decimal(sqft) if sqft else None,
                pieces_per_box=pieces, batch_shade_no=shade, caliber_code=caliber,
                **scope,
            )
            await db.flush()

            batch_no = shade or "BATCH-OPENING"
            for warehouse_id, boxes in OPENING.items():
                exists = await db.execute(
                    select(ProductBatchStock.id).where(
                        ProductBatchStock.product_id == code,
                        ProductBatchStock.warehouse_id == warehouse_id,
                        ProductBatchStock.batch_no == batch_no,
                    )
                )
                if exists.first() is None:
                    db.add(ProductBatchStock(
                        id=f"PBS-{uuid.uuid4().hex[:12]}", uuid=str(uuid.uuid4()),
                        product_id=code, warehouse_id=warehouse_id, batch_no=batch_no,
                        mrp=price_value, sale_rate=price_value,
                        quantity=Decimal(boxes), reserved_quantity=Decimal("0"), damaged_quantity=Decimal("0"),
                        **scope,
                    ))
        await db.commit()

    await control_engine.dispose()
    await company_engine.dispose()
    print(f"Seeded {COMPANY_NAME}: {len(LOCATIONS)} locations, {len(TILES)} products, {len(CUSTOMERS)} customers.")


if __name__ == "__main__":
    asyncio.run(seed())
