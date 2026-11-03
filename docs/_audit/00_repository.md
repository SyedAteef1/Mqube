<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Email        : ateef@tileflow.in
  Version      : 3.16.0
  Created      : 2026-08-17
  Modified     : 2026-08-17
  Copyright    : (c) tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
  Classification: Open Source -- Audit Artifact
-->

# TILEFLOW Retail OS -- Repository Inventory
## Phase 0: Repository Baseline

**Audit Date:** 2026-08-17
**Auditor:** TILEFLOW Documentation Reconciliation Engine v2.0

---

## 1. Repository Identity

| Field | Value |
|---|---|
| **Repository Root** | F:\SMRITRretailNX |
| **Branch** | tileflowNX |
| **Latest Commit** | 41855c17daf5fdf1f281c4f0bd5f8c78ab344ca5 |
| **Commit Date** | 2026-08-17 05:46:04 +0530 |
| **Commit Message** | docs: update development status report with latest commit metadata |
| **Remote Origin** | origin/tileflowNX -- up to date |

---

## 2. Working Tree State (git status at Audit Start)

Modified (not staged):
  DEVELOPMENT_STATUS.md
  backend/app/api/v1/company_center.py
  backend/app/services/db_resolver.py
  backend/app/tests/conftest.py
  backend/tests/t_comp_ctr_sec.py
  docs/reports/2026-08-17/CHANGE_HISTORY.md
  docs/reports/2026-08-17/DEVELOPMENT_STATUS.md

Untracked:
  backend/tests/conftest.py

STOP CONDITION NOTE: Pre-existing unstaged application-code changes exist. Audit will NOT reset or clean any changes.

---

## 3. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| Frontend | React + Vite + TypeScript | vite.config.ts, src/ |
| Backend | Python / FastAPI | backend/app/ |
| Database | PostgreSQL | tileflowsys (Control Plane) |
| ORM | SQLAlchemy (async) | backend/app/db/session.py |
| Migrations | Alembic | backend/alembic/ |
| Test Framework | Pytest (async) | backend/app/tests/, backend/tests/ |
| Container | Docker / Docker Compose | Dockerfile, docker-compose.yml |
| Auth | JWT Bearer tokens | backend/app/core/security.py |

---

## 4. Migration Status (CRITICAL FINDING)

alembic_status.txt shows migration ran to 94fdee7fd6ab head before the latest batched migrations.

Migration to j6k7l8m9n0o (product identity tables) ERRORED with:
  asyncpg.exceptions.InvalidTextRepresentationError: invalid input syntax for type json
  DETAIL: Token "'" is invalid.

This is caused by JSONB server_default=text("'{}'") syntax failure.
STATUS: Some tables in the latest migrations (product_identity engine, v1333-v1335) may NOT exist in the current tileflowsys database.

---

## 5. Database Configuration (Notable Inconsistency)

| Setting | Value |
|---|---|
| DATABASE_URL (primary) | postgresql+asyncpg://postgres:postgres@localhost:5432/tileflowsys |
| CONTROL_DATABASE_URL | postgresql+asyncpg://postgres:postgres@localhost:5432/TileFlowSys |
| PSV_DATABASE_URL | postgresql+asyncpg://postgres:postgres@localhost:5432/TileFlowPSV |
| ECOM_DATABASE_URL | postgresql+asyncpg://postgres:postgres@localhost:5432/TileFlowEcom |
| USE_MULTI_DB_ROUTER | False (feature flagged OFF) |

INCONSISTENCY: CONTROL_DATABASE_URL uses mixed-case TileFlowSys vs lowercase tileflowsys in DATABASE_URL.
