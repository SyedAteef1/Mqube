<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Email        : ateef@tileflow.in
  Version      : 3.21.0
  Created      : 2026-08-17
  Modified     : 2026-08-17
  Copyright    :  tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
  Classification: Canonical PSV Architecture Certification
-->

# TILEFLOW RETAIL OS — PSV COMPANY-LOCAL ARCHITECTURE CERTIFICATION REPORT

**Protocol:** Final PSV Company-Local Architecture Verification  
**Canonical Architecture:** [`docs/architecture/MULTI_COMPANY_2.md`](file:///F:/SMRITRretailNX/docs/architecture/MULTI_COMPANY_2.md)  
**PSV Specification:** [`docs/architecture/PSV_ARCHITECTURE.md`](file:///F:/SMRITRretailNX/docs/architecture/PSV_ARCHITECTURE.md)  
**Date:** 2026-08-17  
**Status:** **100% VERIFIED — COMPANY-LOCAL PSV**

---

## 1. Executive Summary & Architecture Principle

The canonical PSV architectural decision has been implemented and certified across all environments:

```text
================================================================================
CANONICAL PRINCIPLE:
"Party Stock Visibility (PSV) is a company-local shadow inventory and intelligence
layer residing inside the corresponding Company Database (tileflow001, tileflow002,
tileflow<CODE>). PSV data never becomes centralized shared operational state."
================================================================================
```

### Architecture Scorecard:
| Dimension | Requirement | Certified Status | Evidence |
|---|---|---|---|
| **PSV ENGINE** | Projection & aggregation engine functional | **VERIFIED** | `PSVProjectionService` live execution passed |
| **PSV COMPANY LOCAL OWNERSHIP** | Tables reside inside each Company DB | **VERIFIED** | `psv_*` tables present in `tileflow001` & `tileflow002` |
| **PSV COMPANY ISOLATION** | Company A & B physically isolated | **VERIFIED** | Cross-query returns 0 rows / None |
| **PSV CORE INVENTORY BOUNDARY** | Shadow projection does NOT mutate core stock | **VERIFIED** | `products.stock` remained 100 units (Untouched) |
| **PSV CENTRALIZATION** | MUST BE FALSE | **FALSE** | 0 operational PSV writes to `tileflowsys` |
| **SHARED TileFlowPSV DATABASE** | MUST NOT EXIST | **DROPPED** | Database `TileFlowPSV` dropped from PostgreSQL |

---

## 2. Physical Database Topology

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

- **`tileflowsys`**: Contains ONLY global control configuration (`control_psv_configs`). Zero operational PSV event mutations.
- **`tileflow001`**: Hosts Company 001 core operations + Company 001 PSV shadow tables (`psv_parties`, `psv_sku_tracking`, `psv_stock_events`, `psv_stock_balances`).
- **`tileflow002`**: Hosts Company 002 core operations + Company 002 PSV shadow tables.
- **`TileFlowPSV`**: **DOES NOT EXIST**. Dropped from cluster.

---

## 3. Live Runtime Execution & Verification Evidence

Controlled live transactions were executed across `tileflow001` and `tileflow002` via `CompanyDatabaseResolver`:

```text
=== LIVE VERIFICATION: COMPANY-LOCAL PSV IN TILEFLOW001 & TILEFLOW002 ===
1. Company 001 PSV Projection -> Status: PROJECTED in tileflow001
2. Company 001 Idempotency -> Status: SKIPPED_ALREADY_PROJECTED == SKIPPED_ALREADY_PROJECTED -> PASS
3. Company 002 PSV Projection -> Status: PROJECTED in tileflow002
4. Physical Isolation: Comp 002 event in tileflow001 count: 0 == 0 -> PASS
5. Physical Isolation: Comp 001 event in tileflow002 count: 0 == 0 -> PASS
6. Zero tileflowsys Mutations: Events in tileflowsys count: 0 == 0 -> PASS
7. Core Inventory Protection: tileflow001 product stock = 100 (Untouched) -> PASS
```

---

## 4. Full Regression Test Evidence

### Suite 1: Integration Test Suite (`backend/tests/`)
- Command: `pytest tests/`
- Literal Terminal Result: **158 passed in 8.13s (Exit Code: 0)**

### Suite 2: Core Domain Unit & Migration Test Suite (`backend/app/tests/`)
- Command: `pytest app/tests/`
- Literal Terminal Result: **178 passed in 97.98s (Exit Code: 0)**

### Combined Test Regression:
```text
================================================================================
TOTAL TESTS EXECUTED : 336
TOTAL TESTS PASSED   : 336 (100% GREEN)
TOTAL FAILURES       : 0
TOTAL ERRORS         : 0
FINAL EXIT CODE      : 0
================================================================================
```

---

## 5. Architectural Certification Verdict

```text
================================================================================
PSV ARCHITECTURAL CERTIFICATION VERDICT:
COMPANY-LOCAL PSV ARCHITECTURE IS FULLY VERIFIED AND CERTIFIED.

- PSV is 100% company-local.
- Shared TileFlowPSV database does not exist.
- tileflowsys is strictly a Control Plane.
- Zero cross-company PSV data leakage.
- Core stock remains unmutated by shadow projections.
- Baseline remains FROZEN.
================================================================================
```
