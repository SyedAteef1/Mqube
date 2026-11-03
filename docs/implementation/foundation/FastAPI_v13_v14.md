<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Designation  : Chief Systems Architect & Creator
  Email        : ateef@tileflow.in
  Version      : 3.16.0
  Created      : 2026-07-13
  Modified     : 2026-07-13
  Copyright    :  tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
  Classification: Open Source
-->

# Implementation Plan: Post-Verification Corrections & Remaining Gaps (v13 → v14)

This plan outlines the refactoring of the Express.js routes to migrate `saveDb()` calls to the repository/persistence layer, verifies the staff user response schema fields population, and designs the standalone frontend Indian numbering format and HSN/GST master lookup table utilities.

---

## User Review Required

For the migration of `saveDb()` to the repository layer, we propose creating a unified `IStateRepository` / `MemoryStateRepository` / `PostgresStateRepository` wrapper that isolates mutations and encapsulates `saveDb()` execution. This satisfies the requirement of having 0 files calling `saveDb()` directly under `src/routes/` while maintaining current operational logic and data filters.

---

## Open Questions

None.

---

## Proposed Changes

### Express.js Gateway (Backend & Core Interface Layer)
- **db.ts**: Add `IStateRepository` interface to handle collections read/write and persistence.
- **di.ts**: Register `state` repository in `DIContainer` and bind to Postgres / Memory / Sqlite / IndexedDb adapters.
- **MemoryRepositories.ts**: Implement `MemoryStateRepository` executing mutations and invoking `store.saveDb()`.
- **PgRepos.ts**: Implement `PostgresStateRepository`.
- Refactor all 12 route files under `src/routes/` to call `await container.state.saveDb()`.

### React Frontend (Indian Market Core Enhancements)
- **indianFormat.ts**: Create Indian numbering layout formatter function (lakh/crore comma placement).
- **hsnMaster.ts**: Create HSN code GST rate utility mapping and verification tables.

---

## Verification Plan

### Automated Tests
- Run Express/JS tests using `npm test`.
- Run FastAPI/Python tests using `pytest`.
