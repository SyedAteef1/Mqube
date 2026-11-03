<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Email        : ateef@tileflow.in
  Version      : 3.21.0
  Created      : 2026-08-17
  Modified     : 2026-08-17
  Copyright    :  tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
  Classification: Canonical PSV Architecture Specification
-->

# TILEFLOW Party Stock Visibility (PSV) Architecture Specification v1.0

> **CANONICAL REFERENCE:** [`docs/architecture/MULTI_COMPANY_2.md`](file:///F:/SMRITRretailNX/docs/architecture/MULTI_COMPANY_2.md)  
> **Status:** **VERIFIED (COMPANY-LOCAL PSV)**

**Canonical Principle:**
> "Party Stock Visibility (PSV) is a company-local shadow inventory and intelligence layer residing inside the corresponding Company Database (`tileflow001`, `tileflow002`, `tileflow<CODE>`). PSV data never becomes centralized shared operational state."

**Service:** `app.services.psv_projection_service.PSVProjectionService`  
**Configuration Model (Control Plane):** `app.models.control.control_models.ControlPSVConfig` (in `tileflowsys`)  
**Data Models (Company-Local):** `app.models.psv.PSVStockEvent`, `app.models.psv.PSVStockBalance`, `app.models.psv.PSVParty`, `app.models.psv.PSVSKUTracking`  

---

## 1. Executive Summary & Purpose

Party Stock Visibility (PSV) is a decoupled, asynchronous shadow-ledger projection subsystem that provides real-time channel, consignment, vendor, and multi-party stock visibility across partner networks.

### Critical Architectural Boundary
> **PSV is Shadow Inventory & Inventory Intelligence — NEVER the Core Inventory Authority.**
> PSV projections do not directly mutate core inventory tables (`products`, `stock_movements`, `inventory_ledger_entries`), accounting ledgers, or statutory tax records. It maintains an immutable stream of shadow stock events and aggregated party balances.

---

## 2. PSV Data Topology & Routing

```text
                    tileflowsys
                  CONTROL PLANE
                  (control_psv_configs)
                       │
               Company Resolver
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     tileflow001      tileflow002      tileflow00N
        │              │              │
      PSV-001        PSV-002        PSV-N
        │              │              │
        └── Company-local shadow inventory (psv_*)
```

Flow:
```text
User / API Request -> Auth & Company Context -> CompanyDatabaseResolver -> Company DB (e.g. tileflow001) -> PSV Tables in tileflow001
```

---

## 3. Data Models & Schema

1. **`ControlPSVConfig`** (Control Plane in `tileflowsys`):
   - Company-level governance toggle to enable or disable PSV shadow event emission.
   - Fields: `company_id`, `is_psv_enabled`, `sync_mode`, `retention_days`.

2. **`PSVStockEvent`** (Company-Local in `tileflow<Code>`):
   - Append-only immutable log of party inventory movements.
   - **Idempotency Key:** Compound unique index on `(company_code, source_event_id)`.

3. **`PSVStockBalance`** (Company-Local in `tileflow<Code>`):
   - Running balances per party, company, and SKU.
   - Fields: `id`, `company_code`, `psv_party_id`, `sku`, `billed_qty`, `received_qty`, `sold_qty`, `returned_qty`, `transferred_qty`, `current_balance`, `last_event_id`, `last_updated_at`.

4. **`PSVParty` & `PSVSKUTracking`** (Company-Local in `tileflow<Code>`):
   - Partner registry and tracking metadata within each company database.

---

## 4. Operational Invariants & Service Guarantees

1. **Company-Local Physical Isolation:** Company 001 PSV events reside only in `tileflow001`; Company 002 PSV events reside only in `tileflow002`. Cross-company contamination is physically impossible.
2. **Idempotent Projections:** Duplicate event emissions with identical source event IDs return `SKIPPED_ALREADY_PROJECTED` without double-incrementing balances.
3. **Core Inventory Non-Mutation:** Projections to `psv_stock_events` never mutate `products.stock` or `stock_movements`.
4. **Zero Control Plane Mutations:** PSV events are never written to `tileflowsys`.

---

## 5. Database Deployment Reality

- **Canonical Architecture:** **100% COMPANY-LOCAL PSV**.
- **Shared `TileFlowPSV` Database:** **SUPERSEDED & DROPPED**. No shared operational PSV database exists.
- **Status:** **VERIFIED & OPERATIONAL (COMPANY-LOCAL)**.
