<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Email        : ateef@tileflow.in
  Version      : 3.16.0
  Created      : 2026-08-15
  Modified     : 2026-08-15
  Copyright    :  tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
  Classification: Open Source
-->

# TILEFLOW Seventh Gate — Vite + React Frontend Architecture Specification v1.0

**Status: FRONTEND_VITE_REACT = READY**  
**Audit Timestamp:** 2026-08-15 05:55:36 UTC  
**Principle Locked:** "React/Vite knows the Company Context (`company_id`). React/Vite NEVER knows the Company Database (`tileflow001`)."

---

## 1. Frontend Security & Isolation Audit Summary

```text
Browser / React Frontend
        ↓ (Selected company_id = COMP-001)
/api/v1/menus/resolved & Business APIs
        ↓ (Header: x-company-id = COMP-001)
FastAPI Backend (CompanyDatabaseResolver)
        ↓ (Resolves COMP-001 -> tileflow001 via tileflowsys.company_database_registries)
PostgreSQL Database tileflow001
```

- **Direct PostgreSQL Connections in React**: **NONE (0 Direct DB Calls)**
- **Database Name References in Frontend Bundle**: **NONE (0 Leaks in dist/ Bundle)**
- **Database Credentials in Bundle**: **NONE (0 Secrets Exposed)**
- **Authoritative Security Gate**: **FastAPI 403 Forbidden Response**

---


```text
BACKEND_MULTI_COMPANY = READY
FRONTEND_VITE_REACT   = READY

FINAL GATE CLASSIFICATION: READY_FOR_EXPLICIT_PROVISIONING_APPROVAL
```
