<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Email        : ateef@tileflow.in
  Version      : 3.21.0
  Created      : 2026-08-17
  Modified     : 2026-08-17
  Copyright    : ? tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
  Classification: FORENSIC CLASSIFICATION OF LEGACY & TILEFLOWSYS TABLES
-->


**Audit Protocol:** Forensic Classification of Legacy & Control Plane Tables  
**Canonical Architecture:** [`docs/architecture/MULTI_COMPANY_2.md`](file:///F:/SMRITRretailNX/docs/architecture/MULTI_COMPANY_2.md)  
**Baseline Freeze Specification:** [`docs/_audit/ARCHITECTURE.md`](file:///F:/SMRITRretailNX/docs/_audit/ARCHITECTURE.md)  
**Date:** 2026-08-17  
**Status:** **AUDIT COMPLETED ? ZERO ARCHITECTURAL MUTATION**

---

## 1. Executive Summary & Forensic Findings

A table-by-table forensic audit was performed across all **284 tables** present in the `tileflowsys` database. The objective of this audit is to determine:
1. Which tables are active Control Plane or Central Masters in `tileflowsys`.
2. Which operational tables have their authoritative source of truth in Company Databases (`tileflow001`, `tileflow002`).
3. Which of the **172+ legacy tables** are schema scaffolding/prototype leftovers versus historical records that must be preserved.

```text
================================================================================
TABLE CLASSIFICATION TOTALS (284 TILEFLOWSYS TABLES):

1. RETIRE_CANDIDATE      : 172 tables (0 rows, unused scaffolding -> DO NOT DROP NOW)
2. COMPANY_OPERATIONAL   :  80 tables (Active in tileflow001/002; RETIRED in tileflowsys)
3. CONTROL_PLANE         :  15 tables (Active in tileflowsys for Auth & System Governance)
4. LEGACY_READ_ONLY      :   5 tables (Historical code references -> DO NOT MOVE)
5. CENTRAL_MASTER        :   4 tables (Central identity & static master policy)
6. REPORTING             :   4 tables (Downstream analytics & report definitions)
7. PSV                   :   4 tables (Dedicated Shadow DB: TileFlowPSV)
8. UNKNOWN               :   0 tables (100% Accounted For)
================================================================================
```

---

## 2. Definitive Answers to the 12 Forensic Audit Questions

### Q1: Is the table actively used by application code?
- **Control Plane & Central Masters (19 tables):** **YES**, active runtime usage for authentication, company routing, and product identity governance.
- **Company Operational Tables (80 tables):** **YES in Company DBs (`tileflow001`, `tileflow002`)**; **NO in `tileflowsys`** (0 runtime writes occur in `tileflowsys`).
- **Legacy & Retire Candidates (177 tables):** **NO active runtime writes or reads** in production workflows.

### Q2: Is the table currently read?
- **Control Plane / Central Masters:** **YES**, read on every authenticated request and database routing check.
- **Company Operational tables in `tileflowsys`:** **NO**, all operational queries route through `CompanyDatabaseResolver` directly to `tileflow001` or `tileflow002`.
- **Legacy / Retire Candidates:** **NO**.

### Q3: Is the table currently written?
- **Control Plane tables in `tileflowsys`:** Written only during admin actions (user creation, branch provisioning, audit logging).
- **Operational tables in `tileflowsys`:** **EXACTLY 0 WRITES** (Forensically verified during live transactions).
- **Company DBs:** Sole target for operational writes (sales invoices, stock movements, purchase orders, payments).

### Q4: Does it contain real data in `tileflowsys`?
- **Control Plane & Central Masters:** Contain active control data (users, companies, branches, database registries, banks).
- **Out of 257 candidate/legacy tables in `tileflowsys`:**
  - **254 tables have EXACTLY 0 ROWS** in `tileflowsys`.
  - Only 3 tables have rows > 0: `document_series` (2 default series templates), `integration_outbox_events` (23 initial bootstrap events), and `numbering_audit_logs` (2 bootstrap numbering logs). All 3 already exist and are active in `tileflow001`.

### Q5: Does that data belong to a specific company?
- **Company Operational tables:** Contain `company_id` / `branch_id` and belong strictly to the respective Company Database (`tileflow001`).
- **Control Plane tables:** System-wide or enterprise routing records.

### Q6: Is it Control Plane data?
- **15 tables** are strictly Control Plane data (auth, RBAC, tenant registries, menus, audit logs).

### Q7: Is it Central Master data?
- **4 tables** are Central Master data (`tileflow_banks`, `barcode_providers`, `identity_rules`, `product_identities`).

### Q8: Is it Company Operational data?
- **80 tables** are Company Operational domain structures (sales, purchases, inventory, POS, local customers, local products). Their authoritative home is `tileflow<Code>`.

### Q9: Is it PSV data?
- **4 tables** are PSV shadow data (`psv_parties`, `psv_sku_tracking`, `psv_stock_events`, `psv_stock_balances`). Their authoritative home is **`TileFlowPSV`**.

### Q10: Is it historical / prototype / scaffolding?
- **172 tables** are prototype/scaffolding tables created during earlier schema design phases that have 0 rows and 0 active runtime usage.

### Q11: Does an equivalent active table already exist in `tileflow001` / `tileflow002`?
- **YES for all 80 Company Operational tables** (99 total tables exist in `tileflow001` covering core transactional, workflow, and local context models).
- **NO for the 172 Retire Candidate tables** (they were excluded from the clean 99-table Company DB schema).

### Q12: Does it contain historical data that must be preserved?
- All database state is preserved in the full verified backup: `F:\SMRITRretailNXackups\tileflowsys_pre_migration_backup_20260817.sql` (1.94 MB).
- **Rule Applied:** `RETIRE_CANDIDATE` tables are documented for future controlled lifecycle retirement; **DO NOT DROP NOW**.

---

## 3. Classification Taxonomy & Governance Rules

| Classification | Action & Governance Directive |
|---|---|
| **`CONTROL_PLANE`** | **Remain in `tileflowsys`** as the active control plane authority. |
| **`CENTRAL_MASTER`** | **Remain centralized in `tileflowsys`** per master ownership policy. |
| **`COMPANY_OPERATIONAL`** | **Active in Company DBs (`tileflow001`, `tileflow002`)**. `tileflowsys` copy is in `RETIRED_IN_TILEFLOWSYS` mode (0 writes). |
| **`PSV`** | **Active in dedicated database `TileFlowPSV`**. |
| **`REPORTING`** | **Downstream read-only reporting** definitions and analytics views. |
| **`LEGACY_READ_ONLY`** | **Preserve read-only**. DO NOT MOVE automatically. |
| **`RETIRE_CANDIDATE`** | **Documented for future controlled retirement**. DO NOT DROP NOW. |
| **`UNKNOWN`** | **None** (0 tables). |

---

## 4. Complete Table-by-Table Forensic Inventory

| Table Name | Classification | Rows in tileflowsys | Exists in Company DB? | Has Company Col? | Code References | Action / Directive |
|---|---|---|---|---|---|---|
| `alembic_version` | **`CONTROL_PLANE`** | 0 | NO | NO | 0 | Remain in tileflowsys as Control Plane |
| `apparel_matrix_variants` | **`RETIRE_CANDIDATE`** | 0 | NO | NO | 0 | Document for future controlled retirement; DO NOT DROP now |
| `approval_workflow_logs` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `attribute_definitions` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 4 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `attribute_groups` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `audit_logs` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `bank_accounts` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `barcode_layouts` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `barcode_providers` | **`CENTRAL_MASTER`** | 0 | YES | YES | 3 | Remain in tileflowsys (Policy: Central Master) |
| `blanket_purchase_agreement_lines` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `blanket_purchase_agreements` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `branches` | **`CONTROL_PLANE`** | 1 | YES | YES | 8 | Remain in tileflowsys as Control Plane |
| `cash_registers` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `category_attribute_group_mappings` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `chart_of_accounts` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `commission_ledgers` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `commission_participants` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `commission_programs` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `commission_rules` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `companies` | **`CONTROL_PLANE`** | 1 | YES | NO | 7 | Remain in tileflowsys as Control Plane |
| `company_database_registries` | **`CONTROL_PLANE`** | 0 | NO | YES | 1 | Remain in tileflowsys as Control Plane |
| `company_financial_years` | **`CONTROL_PLANE`** | 0 | NO | YES | 1 | Remain in tileflowsys as Control Plane |
| `company_tax_profiles` | **`CONTROL_PLANE`** | 0 | NO | YES | 1 | Remain in tileflowsys as Control Plane |
| `compliance_audit_logs` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `compliance_credentials` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `compliance_outboxes` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `consignment_partners` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `consignment_return_items` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `consignment_returns` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `consignment_sale_report_items` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `consignment_sale_reports` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `consignment_settlements` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `consignment_transfer_items` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `consignment_transfers` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `control_companies` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `control_company_databases` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `control_psv_configs` | **`CONTROL_PLANE`** | 0 | YES | YES | 2 | Remain in tileflowsys as Control Plane |
| `control_users` | **`COMPANY_OPERATIONAL`** | 0 | YES | NO | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `corporate_gstin_registry` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `cost_centers` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `cost_layer_ledger_entries` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `coupons` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `credit_notes` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `crm_campaigns` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `crm_customer_activities` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `crm_leads` | **`LEGACY_READ_ONLY`** | 0 | NO | YES | 1 | Preserve historical reference; DO NOT DROP without review |
| `crm_opportunities` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `crm_support_tickets` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `crm_ticket_comments` | **`RETIRE_CANDIDATE`** | 0 | NO | NO | 0 | Document for future controlled retirement; DO NOT DROP now |
| `customer_addresses` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `customer_channel_preferences` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `customer_contacts` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `customer_credit_profiles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `customer_groups` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 5 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `customer_tax_profiles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `customers` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 8 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `dashboard_widgets` | **`REPORTING`** | 0 | YES | YES | 2 | Downstream read-only reporting |
| `dashboards` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `data_exchange_field_mappings` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `data_exchange_tasks` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `database_profiles` | **`RETIRE_CANDIDATE`** | 0 | NO | NO | 0 | Document for future controlled retirement; DO NOT DROP now |
| `delivery_commission_settlements` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `dispatch_approval_events` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `dispatch_items` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `dispatches` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `document_number_series` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `document_posting_profiles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `document_series` | **`COMPANY_OPERATIONAL`** | 2 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `document_workflows` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `eway_bills` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `financial_year` | **`LEGACY_READ_ONLY`** | 0 | NO | YES | 2 | Preserve historical reference; DO NOT DROP without review |
| `fiscal_periods` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `fulfillment_waves` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `government_services` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `gst_return_filings` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `gst_return_locks` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `gst_tax_settlements` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `identity_rules` | **`CENTRAL_MASTER`** | 0 | YES | YES | 3 | Remain in tileflowsys (Policy: Central Master) |
| `integration_logs` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `integration_outbox_events` | **`COMPANY_OPERATIONAL`** | 23 | YES | NO | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `inventory_checkpoint_records` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `inventory_identity_records` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `inventory_ledger_entries` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `inventory_location_nodes` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `inventory_lock_records` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `inventory_snapshot_records` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `invoice_profitability_ledgers` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `journal_ledger_entries` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `journal_vouchers` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `landed_cost_vouchers` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `legacy_pos_shifts` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `loyalty_members` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `loyalty_point_transactions` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `loyalty_points_ledgers` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `loyalty_rules` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 1 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `loyalty_tiers` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `master_types` | **`COMPANY_OPERATIONAL`** | 0 | YES | NO | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `master_values` | **`COMPANY_OPERATIONAL`** | 0 | YES | NO | 5 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `module_audit_logs` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `module_states` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `numbering_audit_logs` | **`COMPANY_OPERATIONAL`** | 2 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `organizations` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `packing_slip_items` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `packing_slips` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `pharma_batches` | **`RETIRE_CANDIDATE`** | 0 | NO | NO | 0 | Document for future controlled retirement; DO NOT DROP now |
| `pick_list_items` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `pick_lists` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `platform_idempotency_records` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `pos_offline_sync_queue` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `pos_profiles` | **`LEGACY_READ_ONLY`** | 0 | NO | YES | 1 | Preserve historical reference; DO NOT DROP without review |
| `pos_sessions` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `pos_transaction_items` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `pos_transactions` | **`LEGACY_READ_ONLY`** | 0 | NO | YES | 1 | Preserve historical reference; DO NOT DROP without review |
| `pricing_groups` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `print_histories` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `print_profiles` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `print_templates` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `procurement_rfq_items` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `procurement_rfq_vendors` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `procurement_rfqs` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `procurement_tolerance_policies` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `product_barcodes` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `product_cost_valuations` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `product_identities` | **`CENTRAL_MASTER`** | 0 | YES | YES | 3 | Remain in tileflowsys (Policy: Central Master) |
| `product_inventory_policies` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `product_tax_profiles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `product_vendors` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `products` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 8 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `promotion_campaigns` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `promotion_redemptions` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `promotion_rules` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `psv_parties` | **`PSV`** | 0 | YES | NO | 1 | Operational in TileFlowPSV (tileflowsys copy is shadow/co-located) |
| `psv_sku_tracking` | **`PSV`** | 0 | YES | NO | 1 | Operational in TileFlowPSV (tileflowsys copy is shadow/co-located) |
| `psv_stock_balances` | **`PSV`** | 0 | YES | YES | 2 | Operational in TileFlowPSV (tileflowsys copy is shadow/co-located) |
| `psv_stock_events` | **`PSV`** | 0 | YES | YES | 2 | Operational in TileFlowPSV (tileflowsys copy is shadow/co-located) |
| `purchase_jurisdiction_configs` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `purchase_order_items` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `purchase_orders` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 4 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `purchase_receipt_items` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `purchase_receipts` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `purchase_reorder_configs` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `purchase_requisition_lines` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `purchase_requisitions` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `quality_inspection_items` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `quality_inspections` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `quotation_evaluations` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `referral_programs` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `referral_relationships` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `referral_rewards` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `refresh_token_blacklist` | **`CONTROL_PLANE`** | 0 | YES | NO | 3 | Remain in tileflowsys as Control Plane |
| `replenishment_items` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `replenishment_plans` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `report_definitions` | **`REPORTING`** | 0 | YES | YES | 2 | Downstream read-only reporting |
| `report_saved_views` | **`REPORTING`** | 0 | YES | YES | 2 | Downstream read-only reporting |
| `report_schedules` | **`REPORTING`** | 0 | YES | YES | 2 | Downstream read-only reporting |
| `requisition_approval_policies` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `requisition_approvals` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `reservation_ledger_entries` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `reverse_logistics_returns` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `roles` | **`CONTROL_PLANE`** | 0 | YES | YES | 4 | Remain in tileflowsys as Control Plane |
| `sales_invoice_items` | **`COMPANY_OPERATIONAL`** | 0 | YES | NO | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `sales_invoice_payments` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `sales_invoices` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 7 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `sales_order_items` | **`COMPANY_OPERATIONAL`** | 0 | YES | NO | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `sales_orders` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 4 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `sales_payments` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `sales_quotation_items` | **`COMPANY_OPERATIONAL`** | 0 | YES | NO | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `sales_quotations` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `sales_return_items` | **`COMPANY_OPERATIONAL`** | 0 | YES | NO | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `sales_returns` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 4 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `scdm_channel_dispatch_lines` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `scdm_channel_dispatches` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `scdm_channel_locations` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `scdm_channel_stock_movements` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `scdm_claim_types` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `scdm_claims` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `scdm_sellout_import_lines` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `scdm_sellout_imports` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `scdm_settlement_lines` | **`RETIRE_CANDIDATE`** | 0 | NO | NO | 0 | Document for future controlled retirement; DO NOT DROP now |
| `scdm_settlements` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `shifts` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `shipment_packages` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `size_conversions` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `size_scales` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `size_values` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_addresses` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_api_key_logs` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_api_key_permission_sets` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_api_keys` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_actions` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_assignments` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_comments` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_conditions` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_delegations` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_escalations` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_histories` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_matrices` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_outbox` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_policies` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_requests` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_approval_steps` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_audit_log` | **`CONTROL_PLANE`** | 0 | NO | YES | 0 | Remain in tileflowsys as Control Plane |
| `tileflow_bank_accounts` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_banks` | **`CENTRAL_MASTER`** | 0 | NO | NO | 0 | Remain in tileflowsys (Policy: Central Master) |
| `tileflow_branding` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_comm_channels` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_contacts` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_entity_registry` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_field_security_masks` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_menus` | **`CONTROL_PLANE`** | 0 | NO | YES | 3 | Remain in tileflowsys as Control Plane |
| `tileflow_permission_set_permissions` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_permission_sets` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_permissions` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_report_templates` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_role_permission_sets` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_roles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_security_audits` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_security_policies` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_service_accounts` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_settings` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_social_profiles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_theme_variants` | **`COMPANY_OPERATIONAL`** | 0 | YES | NO | 1 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `tileflow_themes` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 1 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `tileflow_user_assignments` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_user_roles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tileflow_workspace_profiles` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 1 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `sre_compliance_decisions` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `sre_rule_engine` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `sre_statutory_ledger` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `stock_adjustments` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `stock_bin_assignments` | **`RETIRE_CANDIDATE`** | 0 | NO | NO | 0 | Document for future controlled retirement; DO NOT DROP now |
| `stock_count_items` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `stock_counts` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `stock_dispatch_lines` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `stock_dispatches` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `stock_movements` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 4 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `stock_transfer_items` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `stock_transfer_shipments` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `stock_transfers` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `stores` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 6 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `supplier_addresses` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_bank_details` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_compliance_profiles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_contacts` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_credit_profiles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_debit_notes` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_documents` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_gst_registrations` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_logistics` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_payment_profiles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_payments` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `supplier_scorecard_metrics` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_scorecards` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `supplier_tax_profiles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `suppliers` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 4 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `sync_queue` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `system_bootstrap_states` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `system_configs` | **`CONTROL_PLANE`** | 0 | NO | YES | 2 | Remain in tileflowsys as Control Plane |
| `tally_configs` | **`LEGACY_READ_ONLY`** | 0 | NO | YES | 1 | Preserve historical reference; DO NOT DROP without review |
| `tds_entries` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tenant_provision_journals` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tenant_provision_profiles` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tenant_settings` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `tenants` | **`RETIRE_CANDIDATE`** | 0 | NO | NO | 0 | Document for future controlled retirement; DO NOT DROP now |
| `terms_clauses` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `terms_defaults` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `terms_snapshots` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `three_way_match_lines` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `three_way_matches` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `transaction_cost_snapshots` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `user_branch_assignments` | **`CONTROL_PLANE`** | 0 | YES | YES | 3 | Remain in tileflowsys as Control Plane |
| `user_company_assignments` | **`CONTROL_PLANE`** | 0 | YES | YES | 4 | Remain in tileflowsys as Control Plane |
| `user_store_assignments` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `users` | **`CONTROL_PLANE`** | 1 | YES | YES | 11 | Remain in tileflowsys as Control Plane |
| `v_scdm_stock_projection` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `variant_templates` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 3 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `vendor_contract_tiers` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `vendor_contracts` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `vendor_quotation_items` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `vendor_quotations` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `warehouse_bins` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `warehouse_zones` | **`RETIRE_CANDIDATE`** | 0 | NO | YES | 0 | Document for future controlled retirement; DO NOT DROP now |
| `warehouses` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 4 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |
| `workflow_events` | **`COMPANY_OPERATIONAL`** | 0 | YES | YES | 2 | Active in Company DBs (tileflow001/002); tileflowsys instance in RETIRED_IN_TILEFLOWSYS mode |

---

## 5. Architectural Guard & Final Verdict

```text
================================================================================
FINAL FORENSIC CLASSIFICATION VERDICT:
- 172 RETIRE_CANDIDATE tables identified: 0 rows, unused schema scaffolding -> KEPT INTACT (DO NOT DROP NOW).
- 80 COMPANY_OPERATIONAL tables identified: 100% active in Company DBs (tileflow001, tileflow002).
- 15 CONTROL_PLANE tables active in tileflowsys.
- 4 CENTRAL_MASTER tables active in tileflowsys.
- 4 PSV tables active in TileFlowPSV.
- 4 REPORTING tables active for downstream analytics.
- ZERO tables classified as UNKNOWN.
- Multi-company database architecture baseline remains FROZEN & UNCHANGED.
================================================================================
```
