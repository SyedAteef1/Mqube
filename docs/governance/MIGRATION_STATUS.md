<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Designation  : Chief Systems Architect & Creator
  Email        : ateef@tileflow.in
  Version      : 3.18.0
  Created      : 2026-07-14
  Modified     : 2026-07-14
  Copyright    :  tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
  Classification: Open Source
-->

# TILEFLOW Migration Status Registry

This ledger tracks the migration of TILEFLOW components from the legacy Express backend and file-system persistence (`db_store.json`) to the FastAPI backend and PostgreSQL transactional persistence layer.

| Module | Express Enabled | FastAPI Enabled | Frontend Caller | Tests Pass | Migration Status | Cutover Completed |
|---|---|---|---|---|---|---|
| **Company / Branch** | ❌ (Decommissioned) | ✅ | FastAPI (`apiFetchV1`) | ✅ | Done | Yes |
| **Stores / Warehouses** | ❌ (Decommissioned) | ✅ | FastAPI (`apiFetchV1`) | ✅ | Done | Yes |
| **Master Lookup Values** | ❌ (Decommissioned) | ✅ | FastAPI (`apiFetchV1`) | ✅ | Done | Yes |
| **Purchase (PO / GRN)** | ✅ | ✅ | Express (`fetch`) | ✅ (Phase 0) | Ready | No (Feature flag `false`) |
| **POS Counter & Shifts** | ✅ | ✅ | Express (`fetch`) | ✅ (Phase 0) | Ready | No (Feature flag `false`) |
| **Sales (Invoices)** | ✅ | ⚠️ Partial | Express (`fetch`) | ⚠️ Partial | In Progress | No (Feature flag `false`) |
| **Inventory Stock Ledger** | ⚠️ Inline | ⚠️ Models | Express (`fetch`) | ❌ | Pending | No |
| **Accounting vouchers** | ✅ (General Ledger) | ❌ | Express (`fetch`) | ❌ | Deferred | No |

---

## Active Cutover Feature Flags

Every active migration feature flag must be documented below.

### 1. `USE_FASTAPI_SALES`
* **Owner:** Syed Ateef
* **Target Removal Version:** v3.19.0
* **Target Removal Date:** 2026-08-15
* **Reason:** Gates frontend redirection of Sales invoices, quotations, orders, and returns to FastAPI.

### 2. `USE_FASTAPI_PURCHASE`
* **Owner:** Syed Ateef
* **Target Removal Version:** v3.19.0
* **Target Removal Date:** 2026-08-15
* **Reason:** Gates frontend redirection of Purchase orders, receipts, suppliers, and configs to FastAPI.

### 3. `USE_FASTAPI_POS`
* **Owner:** Syed Ateef
* **Target Removal Version:** v3.19.0
* **Target Removal Date:** 2026-08-15
* **Reason:** Gates frontend redirection of POS shift open/close and register logs to FastAPI.
