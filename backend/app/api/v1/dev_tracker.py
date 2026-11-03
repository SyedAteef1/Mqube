from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from ...dev_tracker.scanner import scan_codebase
from ...dev_tracker.reports import write_reports
from ..deps import require_role
from ...models.auth import User, UserRole

router = APIRouter()

# In-memory scan results caching
cached_results: Dict[str, Any] = {}

@router.get("/dev-tracker", tags=["Development Intelligence"])
async def get_dev_tracker_status(
    current_user: User = Depends(require_role(UserRole.SYSADMIN))
):
    """
    Get latest cached codebase development diagnostics scan results (SYSADMIN required).
    """
    global cached_results
    if not cached_results:
        try:
            results = scan_codebase()
            write_reports(results)
            cached_results = results
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Codebase initial scan failed: {e}")
            
    return cached_results

@router.post("/dev-tracker/scan", tags=["Development Intelligence"])
async def trigger_dev_tracker_scan(
    current_user: User = Depends(require_role(UserRole.SYSADMIN))
):
    """
    Trigger on-demand codebase static scan, rewrite reports, and reload memory cache (SYSADMIN required).
    """
    global cached_results
    try:
        results = scan_codebase()
        write_reports(results)
        cached_results = results
        return cached_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Codebase static scan failed: {e}")
