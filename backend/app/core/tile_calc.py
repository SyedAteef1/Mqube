"""Tile quantity conversions. Tiles are stocked and sold in whole boxes."""

from decimal import Decimal, ROUND_CEILING
from typing import Dict


def boxes_for_sqft(sqft_requested: Decimal, sqft_per_box: Decimal) -> Dict[str, Decimal]:
    """
    Converts a customer's Sq.Ft. requirement into whole boxes, rounding up
    because a box cannot be split. `sqft_billed` is the area actually supplied.
    """
    sqft_requested = Decimal(str(sqft_requested))
    sqft_per_box = Decimal(str(sqft_per_box))

    if sqft_requested <= 0:
        raise ValueError("Sq.Ft. required must be greater than zero.")
    if sqft_per_box <= 0:
        raise ValueError("Sq.Ft. per box must be greater than zero.")

    boxes = (sqft_requested / sqft_per_box).to_integral_value(rounding=ROUND_CEILING)
    return {"boxes": boxes, "sqft_billed": boxes * sqft_per_box}
