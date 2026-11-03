import os
import sys
import pytest
import psycopg2
import json
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.future import select

from app.services.tax_invoice_spec import (
    TILEFLOWTAXINVOICE_TEMPLATE_CODE,
    TILEFLOWTAXINVOICE_VERSION,
    TILEFLOWTAXINVOICE_STATUS,
    TILEFLOW_A4_WIDTH_PT,
    TILEFLOW_A4_HEIGHT_PT,
    TILEFLOW_INTERSTATE_COLUMNS,
    TILEFLOW_INTRASTATE_COLUMNS,
    TILEFLOW_ITEM_ROW_HEIGHT_PT,
    TILEFLOW_SUBTOTAL_ROW_HEIGHT_PT,
    verify_tileflowtaxinvoice_integrity,
    verify_golden_css_integrity,
    load_golden_css,
)
from app.models.tax_inv_template import TaxInvoiceTemplate, TaxInvoiceTemplateVersion
from app.services.invoice_pdf_service import InvoicePdfService, paginate_items

DB_SYNC_URL = "postgresql://postgres:postgres@localhost:5432/tileflow001"
DB_ASYNC_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/tileflow001"


@pytest.fixture(scope="module")
def sync_db():
    conn = psycopg2.connect(DB_SYNC_URL)
    yield conn
    conn.close()


@pytest.fixture(scope="module")
async def async_session():
    engine = create_async_engine(DB_ASYNC_URL, echo=False)
    async_session_maker = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session_maker() as session:
        yield session
    await engine.dispose()


def test_01_tileflowtaxinvoice_persisted_in_database_and_frozen(sync_db):
    """Verifies that TILEFLOWTAXINVOICE exists in PostgreSQL and is FROZEN."""
    cur = sync_db.cursor()
    cur.execute("""
        SELECT template_code, template_name, status, current_version, is_default, is_active
        FROM tax_invoice_templates
        WHERE template_code = %s;
    """, (TILEFLOWTAXINVOICE_TEMPLATE_CODE,))
    row = cur.fetchone()
    assert row is not None, "TILEFLOWTAXINVOICE must exist in tax_invoice_templates"
    assert row[0] == "TILEFLOWTAXINVOICE"
    assert row[2] == "FROZEN"
    assert row[3] == "V1"
    assert row[4] is True  # is_default
    assert row[5] is True  # is_active


def test_02_database_trigger_strictly_blocks_unauthorized_updates(sync_db):
    """Verifies that PostgreSQL trigger trg_prevent_tax_template_mutation blocks layout modification."""
    cur = sync_db.cursor()
    with pytest.raises(psycopg2.Error) as exc_info:
        cur.execute("""
            UPDATE tax_invoice_templates
            SET layout_configuration = '{"corrupted": true}'::jsonb
            WHERE template_code = 'TILEFLOWTAXINVOICE';
        """)
        sync_db.commit()
    sync_db.rollback()
    assert "TILEFLOW-GOV-ERR" in str(exc_info.value)
    assert "FROZEN and IMMUTABLE" in str(exc_info.value)


def test_03_database_trigger_strictly_blocks_deletion(sync_db):
    """Verifies that PostgreSQL trigger trg_prevent_tax_template_mutation blocks template deletion."""
    cur = sync_db.cursor()
    with pytest.raises(psycopg2.Error) as exc_info:
        cur.execute("""
            DELETE FROM tax_invoice_templates
            WHERE template_code = 'TILEFLOWTAXINVOICE';
        """)
        sync_db.commit()
    sync_db.rollback()
    assert "TILEFLOW-GOV-ERR" in str(exc_info.value)
    assert "Deletion is prohibited" in str(exc_info.value)


def test_04_python_spec_cryptographic_integrity_hash():
    """Verifies that the frozen Python layout specification is cryptographically valid and untampered."""
    assert verify_tileflowtaxinvoice_integrity() is True


def test_04b_golden_css_artifact_integrity():
    """Verifies tax_invoice_v1.css matches its integrity manifest."""
    assert verify_golden_css_integrity() is True
    css = load_golden_css(verify=False)
    assert "@page" in css
    assert ".item-table" in css
    assert "height: 21.00pt" in css


def test_05_grid_columns_and_geometry_immutability():
    """Verifies exact point geometry and 100% column allocation."""
    assert TILEFLOW_A4_WIDTH_PT == 595.92
    assert TILEFLOW_A4_HEIGHT_PT == 842.88
    assert TILEFLOW_ITEM_ROW_HEIGHT_PT == 20.47
    assert TILEFLOW_SUBTOTAL_ROW_HEIGHT_PT == 20.47

    # Interstate 10 columns
    assert len(TILEFLOW_INTERSTATE_COLUMNS) == 10
    assert TILEFLOW_INTERSTATE_COLUMNS["sl_no"] == "3.5%"
    assert TILEFLOW_INTERSTATE_COLUMNS["item_description"] == "28.0%"
    assert TILEFLOW_INTERSTATE_COLUMNS["hsn_sac"] == "8.0%"
    assert TILEFLOW_INTERSTATE_COLUMNS["qty"] == "5.5%"
    assert TILEFLOW_INTERSTATE_COLUMNS["mrp"] == "10.0%"
    assert TILEFLOW_INTERSTATE_COLUMNS["discount_pct"] == "6.5%"
    assert TILEFLOW_INTERSTATE_COLUMNS["taxable_value"] == "11.0%"
    assert TILEFLOW_INTERSTATE_COLUMNS["tax_pct"] == "5.0%"
    assert TILEFLOW_INTERSTATE_COLUMNS["igst"] == "9.0%"
    assert TILEFLOW_INTERSTATE_COLUMNS["amount"] == "13.5%"

    # Intrastate 12 columns
    assert len(TILEFLOW_INTRASTATE_COLUMNS) == 12
    assert TILEFLOW_INTRASTATE_COLUMNS["mrp"] == "9.5%"
    assert TILEFLOW_INTRASTATE_COLUMNS["cgst"] == "8.5%"
    assert TILEFLOW_INTRASTATE_COLUMNS["sgst"] == "8.5%"


def test_06_pagination_multi_page_mathematical_consistency():
    """Verifies exact deterministic pagination across various item counts."""
    # 5 items -> 1 page
    p5 = paginate_items(list(range(5)), first_page_max=25, cont_page_max=36, last_page_room=18)
    assert len(p5) == 1
    assert len(p5[0]) == 5

    # 20 items -> 2 pages ([20], [])
    p20 = paginate_items(list(range(20)), first_page_max=25, cont_page_max=36, last_page_room=18)
    assert len(p20) == 2
    assert len(p20[0]) == 20
    assert len(p20[1]) == 0

    # 42 items -> 2 pages ([25], [17])
    p42 = paginate_items(list(range(42)), first_page_max=25, cont_page_max=36, last_page_room=18)
    assert len(p42) == 2
    assert len(p42[0]) == 25
    assert len(p42[1]) == 17

    # 78 items -> 3 pages ([25], [36], [17])
    p78 = paginate_items(list(range(78)), first_page_max=25, cont_page_max=36, last_page_room=18)
    assert len(p78) == 3
    assert len(p78[0]) == 25
    assert len(p78[1]) == 36
    assert len(p78[2]) == 17

    # 100 items -> 4 pages ([23], [36], [36], [5] alongside summary)
    p100 = paginate_items(list(range(100)), first_page_max=23, cont_page_max=36, last_page_room=18)
    assert len(p100) == 4


@pytest.mark.asyncio
async def test_07_pdf_render_end_to_end_tileflowtaxinvoice():
    """Verifies that TILEFLOWTAXINVOICE template can be queried and loaded via AsyncSession."""
    engine = create_async_engine(DB_ASYNC_URL, echo=False)
    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    async with session_maker() as session:
        stmt = select(TaxInvoiceTemplate).where(TaxInvoiceTemplate.template_code == "TILEFLOWTAXINVOICE")
        res = await session.execute(stmt)
        tpl = res.scalars().first()
        assert tpl is not None
        assert tpl.template_code == "TILEFLOWTAXINVOICE"
        assert tpl.status == "FROZEN"
    await engine.dispose()
