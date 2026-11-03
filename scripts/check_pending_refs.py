import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
from sqlalchemy import text
from backend.app.db.session import async_session

async def check_references():
    async with async_session() as session:
        for tbl, col in [
            ("companies", "id"),
            ("branches", "company_id"),
            ("user_company_assignments", "company_id"),
            ("audit_logs", "company_id"),
        ]:
            try:
                res = await session.execute(text(f"SELECT count(*) FROM {tbl} WHERE {col} LIKE 'comp-pending-%'"))
                count = res.scalar()
                print(f"Table '{tbl}'.'{col}' has {count} references to comp-pending-%")
            except Exception as e:
                print(f"Table '{tbl}' check error: {e}")

if __name__ == "__main__":
    asyncio.run(check_references())
