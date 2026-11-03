import pytest
from pydantic import ValidationError

from app.schemas.business_profile import BusinessProfileUpdate


def test_gstin_is_cleaned_and_blank_is_allowed():
    assert BusinessProfileUpdate(name="Shop", gst_number=" 27aaxft2508h1zr ").gst_number == "27AAXFT2508H1ZR"
    assert BusinessProfileUpdate(name="Shop", gst_number="").gst_number is None


def test_invalid_gstin_and_blank_name_are_refused():
    with pytest.raises(ValidationError):
        BusinessProfileUpdate(name="Shop", gst_number="NOT-A-GSTIN")
    with pytest.raises(ValidationError):
        BusinessProfileUpdate(name="")
