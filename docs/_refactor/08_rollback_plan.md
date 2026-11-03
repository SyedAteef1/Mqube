<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Email        : ateef@tileflow.in
  Version      : 3.17.0
  Created      : 2026-08-19
  Modified     : 2026-08-19
  Copyright    :  tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
-->

# 08. Complete Refactor Rollback Plan

---

## 1. Schema Rollback (Database)

If any unexpected regression occurs after applying the Phase 2 migration:

```sql
-- Revert reporting flat view
DROP VIEW IF EXISTS report_flat_inventory_sales;

-- Revert indexes
DROP INDEX IF EXISTS idx_products_variant_id;
DROP INDEX IF EXISTS uq_variant_identity_active;

-- Revert sequence default & sequence
ALTER TABLE products ALTER COLUMN variant_id DROP DEFAULT;
DROP SEQUENCE IF EXISTS products_variant_id_seq;

-- Revert surrogate key column
ALTER TABLE products DROP COLUMN IF EXISTS variant_id;
```

---

## 2. Frontend Code Rollback

- Revert `HeaderAliasRegistry.ts` from git checkpoint commit `fe050f3d`.
- Revert `ExcelGridEntrySec.tsx` from git checkpoint commit `fe050f3d`.
- Revert `backend/app/models/inventory.py` from git checkpoint commit `fe050f3d`.
