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

# TILEFLOW Retail OS -- PSV Subsystem Audit
## Phase 5: Party Stock Visibility (PSV)

**Audit Date:** 2026-08-17
**Scope:** PSV models, projection service, database isolation, enablement flag, tests

---

## 1. PSV Architecture Claim

### Documentation claim (from multiple walkthrough/architecture docs):
PSV is an optional observability/projection layer (shadow inventory).
- Lives in a SEPARATE database: TileFlowPSV (default) or TileFlowPSV_<Code> (dedicated per company)
- Is NOT a transactional source of record
- Is enabled/disabled per company via ControlPSVConfig in tileflowsys

---

## 2. PSV Models Reality (backend/app/models/psv.py)

### Models found:
- PSVParty: psv_parties -- code, name, party_type, is_active, metadata (JSONB)
- PSVPartySkuTracking: psv_party_sku_tracking -- party_id (FK), sku, tracked (bool), notes
- PSVStockEvent: psv_stock_events -- event_id, source_event_id (unique), correlation_id, causation_id, event_schema_version, company_code, source_database, source_document_type, source_document_id, psv_party_id, destination_type, destination_id, psv_store_id, sku, movement_type, quantity (DECIMAL), source_event_created_at, event_date, sync_status, created_at
- PSVStockBalance: psv_stock_balances -- id, company_code, psv_party_id, psv_store_id, sku, billed_qty, received_qty, sold_qty, returned_qty, transferred_qty, current_balance, last_event_id, last_updated_at

### NOTABLE: PSV models do NOT have company_id/branch_id FK columns matching the base BaseEntity pattern. They use company_code (plain string) as the isolation boundary.
### NOTABLE: PSVStockEvent has NO foreign key to tileflowsys.companies -- it uses company_code as a string tag.

### Status: ALIGNED with architecture intent (separate DB, string-isolated by company_code)

---


### Class: PSVProjectionService
### Methods confirmed:
- is_psv_enabled_for_company(control_session, company_code) -> bool
  - Queries ControlPSVConfig in tileflowsys (TileFlowSys) for the company code
  - Returns False if PSV disabled (fail-safe: no activity when disabled)
- project_psv_stock_event(psv_session, event_payload) -> Dict
  - Checks idempotency via source_event_id uniqueness
  - Creates PSVStockEvent record
  - Updates PSVStockBalance (billed_qty, received_qty, sold_qty, returned_qty, current_balance)
  - Commits to psv_session (TileFlowPSV DB)

### Session routing:
- control_session -> tileflowsys (reads ControlPSVConfig)
- psv_session -> TileFlowPSV (writes PSVStockEvent, PSVStockBalance)
- These are DISTINCT session objects -- architecture correctly separates read (control) and write (PSV) sessions

### Status: ALIGNED

---

## 4. ControlPSVConfig Model (backend/app/models/control/control_models.py)

### Fields confirmed:
- company_code (String, required)
- psv_enabled (bool)
- psv_mode: "CENTRAL" (shared TileFlowPSV) or "DEDICATED" (TileFlowPSV_<Code>)
- psv_database_name: default "TileFlowPSV"

### This model lives in the tileflowsys control plane -- consistent with architecture.
### Status: ALIGNED

---

## 5. PSV Database Configuration

### Evidence:
- backend/app/core/config.py line 161: PSV_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/TileFlowPSV"
- TileFlowPSV database MUST be provisioned separately from tileflowsys

### FINDING: No evidence of automatic TileFlowPSV provisioning in the codebase. The PSV database must be manually created or provisioned separately.
### Documentation impact: Docs should clarify that TileFlowPSV requires separate provisioning.
### Status: PARTIALLY_VERIFIED

---

## 6. PSV Test Evidence (backend/app/tests/test_psv.py)

Tests confirmed present:
- test_psv_event_projection_success: Projects a STORE_RECEIVED event, asserts status == "PROJECTED"
- test_psv_idempotency: Projects same source_event_id twice, second returns SKIPPED_ALREADY_PROJECTED
- test_psv_balance_accumulation: Multiple events update billed_qty, sold_qty, current_balance
- test_psv_disabled_company_skip: is_psv_enabled returns False -> projection skipped

### conftest.py clear_db clears PSVPartySkuTracking and PSVParty (lines 92-93) -- confirms PSV model integration in test suite
### Note: PSVStockEvent and PSVStockBalance are NOT in clear_db. This likely means they are in a different DB (TileFlowPSV) not managed by the tileflowsys test engine.

### Status: ALIGNED

---

## 7. PSV Boundary Compliance

### Claim: PSV does NOT modify core inventory tables directly
### Evidence:
- PSVProjectionService.project_psv_stock_event() modifies ONLY PSVStockEvent and PSVStockBalance
- No calls to StockMovement, Product, or inventory tables found in psv_projection.py

### Status: ALIGNED

---

## 8. PSV Documentation Coverage

### Documents found containing PSV:
- docs/walkthrough/db/PostgreSQL.md
- docs/walkthrough/CONSOLIDATED.md
- docs/implementation/foundation/MULTI_DB_PLATFORM.md
- docs/implementation/CONSOLIDATED_PLANS.md
- docs/architecture/COMPANY_001.md
- docs/audits/INTERNAL_ROLE.md
- docs/audits/TILEFLOW_ERP_AUDIT.md
- docs/audits/CONSIGNMENT_AUDIT.md

### FINDING: No dedicated PSV architecture document found in docs/architecture/. PSV is described in walkthroughs and implementation plans but lacks a standalone PSV_ARCHITECTURE spec.
### Recommendation: Create PSV_ARCHITECTURE.md in docs/architecture/ (document-only change -- no code changes).
### Status: PARTIALLY_VERIFIED (system implemented; standalone architecture doc missing)
