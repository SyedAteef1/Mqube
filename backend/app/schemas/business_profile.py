from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ..core.gst_engine import validate_gstin


class BusinessProfile(BaseModel):
    """The owner's details that print on every bill."""

    name: str = Field(..., min_length=1, max_length=255)
    gst_number: Optional[str] = Field(None, max_length=15)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    bank_name: Optional[str] = Field(None, max_length=255)
    bank_account_name: Optional[str] = Field(None, max_length=255)
    bank_account_no: Optional[str] = Field(None, max_length=50)
    bank_ifsc: Optional[str] = Field(None, max_length=20)
    bank_branch: Optional[str] = Field(None, max_length=255)

    model_config = ConfigDict(from_attributes=True)


class BusinessProfileUpdate(BusinessProfile):
    @field_validator("gst_number", mode="before")
    @classmethod
    def gstin_must_be_valid(cls, value: Optional[str]) -> Optional[str]:
        cleaned = (value or "").strip().upper()
        if not cleaned:
            return None
        if not validate_gstin(cleaned)[0]:
            raise ValueError("Enter a valid 15-character GSTIN.")
        return cleaned
