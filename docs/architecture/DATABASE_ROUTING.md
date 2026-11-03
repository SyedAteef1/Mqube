<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Email        : ateef@tileflow.in
  Version      : 3.16.0
  Created      : 2026-08-15
  Modified     : 2026-08-17
  Copyright    :  tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
  Classification: Open Source
-->

# TILEFLOW Database Routing Architecture Specification v1.0

> **CANONICAL REFERENCE:** [`docs/architecture/MULTI_COMPANY_2.md`](file:///F:/SMRITRretailNX/docs/architecture/MULTI_COMPANY_2.md)

**Status:** **ROUTING VERIFIED & OPERATIONAL**  
**Centralized Resolver:** `app.services.company_database_resolver.CompanyDatabaseResolver`  
**Registry Service:** `app.services.control_database_registry.ControlDatabaseRegistryService`  

---

## 1. Routing Architecture Overview

TILEFLOW Retail OS operates on a Multi-Company Database Architecture where:
1. **Control Plane (`tileflowsys`)**: Houses centralized identity, user company assignments, enterprise configurations, and the `company_database_registries` table.
2. **Business Company Databases (`tileflow<3-char-code>`)**: Dedicated physical PostgreSQL databases hosting company-isolated operational data (e.g. `tileflow001` containing 99 domain tables).

```text
Request (with User Context / Company Header)
                      ↓
          CompanyDatabaseResolver
                      ↓
  Query `tileflowsys` Control Plane for Auth & Mapping
                      ↓
     [User Assigned? Company Active? Status READY?]
         /                                 \
     (No)                                 (Yes)
       ↓                                    ↓
403 Forbidden               Return Verified Connection URL
                             (postgresql://...@host:port/tileflow<code>)
```

---

## 2. Company Database Naming Standard

The standard database naming convention is enforced by `generate_company_database_name()`:
- **Prefix:** Exactly `tileflow`.
- **Company Code:** Exactly 3 alphanumeric characters `[A-Z0-9]`.
- **Reserved Codes:**
  - `000`: Permanently reserved (forbidden).
  - `SYS`: Permanently reserved for TILEFLOW Control Plane (`tileflowsys`).
- **Examples:**
  - `001` → `tileflow001`
  - `ABC` → `tileflowABC`
  - `MUM` → `tileflowMUM`

---

## 3. Routing Security Invariants

- **No client-controlled arbitrary database name injection:** The database name is derived deterministically from the registered company code in `tileflowsys`.
- **Fail-closed evaluation:** Unauthorized user → `403 Forbidden`. Suspended or inactive company → `403 Forbidden`. Non-READY database status → `403 Forbidden`.
- **No cross-company query execution:** Each company database is isolated at the PostgreSQL schema/database level.
- **Header as Routing Hint:** `X-Company-Code` header is treated purely as a routing request hint and is strictly verified against the user's assigned permissions in `tileflowsys` before resolving connection metadata.

---

## 4. `USE_MULTI_DB_ROUTER` Feature Flag

- **Configuration:** Defined in `app.core.config.Settings.USE_MULTI_DB_ROUTER: bool = False`.
- **Current Operational Reality:** Dynamic multi-company database resolution is directly executed by `CompanyDatabaseResolver` and `company_router.py` via live registry lookups. `USE_MULTI_DB_ROUTER` serves as an architectural configuration placeholder rather than an active bypass switch. Full multi-tenant physical routing is active wherever `CompanyDatabaseResolver` is invoked.

