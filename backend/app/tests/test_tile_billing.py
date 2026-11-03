from decimal import Decimal

import pytest

from app.core.gst_engine import calculate_line_item_tax
from app.core.tile_calc import boxes_for_sqft
from app.schemas.sales import SalesInvoiceBase, SalesInvoiceItemBase
from app.schemas.wms import WarehouseCreate


@pytest.mark.parametrize(
    "sqft, per_box, boxes, billed",
    [
        ("100", "15.5", "7", "108.5"),  # rounds up
        ("31", "15.5", "2", "31.0"),  # exact multiple adds no extra box
        ("0.5", "15.5", "1", "15.5"),  # any area needs at least one box
    ],
)
def test_boxes_for_sqft(sqft, per_box, boxes, billed):
    result = boxes_for_sqft(Decimal(sqft), Decimal(per_box))
    assert result["boxes"] == Decimal(boxes)
    assert result["sqft_billed"] == Decimal(billed)


@pytest.mark.parametrize("sqft, per_box", [("0", "15.5"), ("-1", "15.5"), ("100", "0")])
def test_boxes_for_sqft_rejects_non_positive(sqft, per_box):
    with pytest.raises(ValueError):
        boxes_for_sqft(Decimal(sqft), Decimal(per_box))


def test_interstate_is_not_forced_false_when_caller_omits_it():
    assert SalesInvoiceBase().is_interstate is None


def test_item_gst_rate_falls_through_to_product_when_omitted():
    assert SalesInvoiceItemBase(code="T1", name="Tile", price=100).gst_rate is None


def test_intrastate_splits_cgst_sgst_and_interstate_uses_igst():
    args = dict(
        unit_price=Decimal("1000"),
        quantity=Decimal("7"),
        discount_amount=Decimal("0"),
        gst_rate=Decimal("18"),
        is_tax_inclusive=False,
    )
    local = calculate_line_item_tax(is_interstate=False, **args)
    assert (local["cgst_amount"], local["sgst_amount"], local["igst_amount"]) == (
        Decimal("630.00"), Decimal("630.00"), Decimal("0.00"),
    )
    outstation = calculate_line_item_tax(is_interstate=True, **args)
    assert outstation["igst_amount"] == Decimal("1260.00")
    assert outstation["cgst_amount"] == Decimal("0.00")


def test_warehouse_location_type_is_limited_to_showroom_or_godown():
    assert WarehouseCreate(code="G1", name="Main").location_type == "GODOWN"
    assert WarehouseCreate(code="S1", name="Front", location_type="SHOWROOM").location_type == "SHOWROOM"
    with pytest.raises(ValueError):
        WarehouseCreate(code="X1", name="Bad", location_type="DEPOT")
