#!/usr/bin/env python3
"""
PHASE 7: Alembic Parity Verification
Requirement: Both tileflowsys and tileflow001 must have same current alembic HEAD
Expected: Both at v1384_company_code_constraint
"""

import asyncio
import subprocess
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def check_alembic_version(db_name: str) -> str:
    """Check the current alembic version in a database."""
    url = f'postgresql+asyncpg://postgres:postgres@localhost:5432/{db_name}'
    try:
        engine = create_async_engine(url)
        async with engine.begin() as conn:
            result = await conn.execute(
                text('SELECT version_num FROM alembic_version ORDER BY version_num DESC LIMIT 1')
            )
            version = result.scalar()
            return version or "NO VERSION FOUND"
    except Exception as e:
        return f"ERROR: {str(e)}"
    finally:
        await engine.dispose()

async def main():
    print("=" * 70)
    print("PHASE 7: Alembic Parity Verification")
    print("=" * 70)
    print()
    
    # Check both databases
    print("Checking alembic HEAD version in both databases:")
    print()
    
    tileflowsys_version = await check_alembic_version('tileflowsys')
    tileflow001_version = await check_alembic_version('tileflow001')
    
    print(f"  tileflowsys: {tileflowsys_version}")
    print(f"  tileflow001: {tileflow001_version}")
    print()
    
    # Verify
    expected = "v1384_company_code_constraint"
    
    tileflowsys_match = tileflowsys_version == expected
    tileflow001_match = tileflow001_version == expected
    parity_match = tileflowsys_version == tileflow001_version
    
    print("GATE VERIFICATION:")
    print(f"  ✅ tileflowsys at {expected}: {tileflowsys_match}")
    print(f"  ✅ tileflow001 at {expected}: {tileflow001_match}")
    print(f"  ✅ Both at same HEAD (parity): {parity_match}")
    print()
    
    if tileflowsys_match and tileflow001_match and parity_match:
        print("✅ PHASE 7 PASSED: Both databases at v1384 (PARITY VERIFIED)")
        return 0
    else:
        print("❌ PHASE 7 FAILED: Databases not at same HEAD")
        return 1

if __name__ == '__main__':
    exit_code = asyncio.run(main())
    exit(exit_code)
