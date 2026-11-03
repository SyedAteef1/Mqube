from fastapi import APIRouter
from pydantic import BaseModel
from ...core.config import settings

router = APIRouter()

class AppMetadata(BaseModel):
    productName: str
    version: str
    edition: str
    organization: str

class MetadataResponse(BaseModel):
    app: AppMetadata

@router.get("/metadata", response_model=MetadataResponse, tags=["Metadata"])
async def get_metadata():
    """
    Fetch TILEFLOW system metadata parameter bindings (name, version, license edition).
    """
    return {
        "app": {
            "productName": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "edition": settings.EDITION,
            "organization": settings.ORGANIZATION
        }
    }
