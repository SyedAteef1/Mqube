import os
from alembic.config import Config
from alembic import command

backend_dir = r"F:\SMRITRretailNX\backend"
ini_path = os.path.join(backend_dir, "alembic.ini")

for db_name in ["tileflow001", "tileflow002", "tileflowsys"]:
    print(f"\n--- Migrating {db_name} to head ---")
    cfg = Config(ini_path)
    cfg.set_main_option("sqlalchemy.url", f"postgresql+asyncpg://postgres:postgres@localhost:5432/{db_name}")
    try:
        command.upgrade(cfg, "v1375_backfill_sales_return_cust")
        print(f"Successfully upgraded {db_name} to v1375_backfill_sales_return_cust")
    except Exception as e:
        print(f"Error upgrading {db_name}: {e}")
