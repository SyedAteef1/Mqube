<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Email        : ateef@tileflow.in
  Version      : 3.21.0
  Created      : 2026-08-17
  Modified     : 2026-08-17
  Copyright    : ? tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
  Classification: Open Source -- Audit & Governance Artifact
-->

# TILEFLOW RETAIL OS ? TABLE OWNERSHIP & MIGRATION MAP

**Date:** 2026-08-17  
**Source Database:** `tileflowsys` (PostgreSQL 15, Total 283 Base Tables)  
**Target Architecture:** Control Plane (`tileflowsys`) + Company Databases (`tileflow<company_code>`)

---


| Classification | Count | Description | Target Authority Database |
|---|---|---|---|
| **CONTROL_PLANE** | 23 | Authentication, Users, Roles, Company/Branch master registries, DB routing registries, Menus, Audit | `tileflowsys` (Remains in Central Control Plane) |
| **CENTRAL_MASTER** | 1 | Global static lookups (Banks IFSC, GST HSN/SAC, States, Currencies) | `tileflowsys` (Central Reference) |
| **COMPANY_OPERATIONAL** | 76 | Transactional business documents, local inventory, sales, purchasing, customer/supplier ledgers | `tileflow001`, `tileflow002`, `tileflow<Code>` (Company DB) |
| **PSV (SHADOW INVENTORY)** | 4 | Party Stock Visibility shadow event ledger and stock balance projections | `tileflowsys` (Currently Co-located) / `TileFlowPSV` (Target) |
| **REPORTING & ANALYTICS** | 4 | Report templates, dashboard compositions, saved views | `tileflow001` / `tileflowsys` (Co-located / Local execution) |
| **LEGACY / RETIRED** | 175 | Historical / experimental tables slated for controlled retirement | `tileflowsys` (Read-only / Slated for future retirement) |
| **TOTAL** | **283** | **All Base Tables in PostgreSQL** | |

---

## 2. Control Plane Tables (`tileflowsys` Authority)

These tables define the global multi-company governance plane and MUST remain in `tileflowsys`:

| Table Name | Source Rows | Primary Key Columns | Description |
|---|---|---|---|
| `alembic_version` | 1 | `version_num` | Control Plane metadata / registry |
| `audit_logs` | 0 | `id, operator, action_type` | Control Plane metadata / registry |
| `barcode_providers` | 0 | `id, uuid, company_id` | Control Plane metadata / registry |
| `branches` | 1 | `id, uuid, company_id` | Control Plane metadata / registry |
| `companies` | 1 | `id, uuid, name` | Control Plane metadata / registry |
| `company_database_registries` | 2 | `company_id, database_id, database_name` | Control Plane metadata / registry |
| `control_companies` | 1 | `id, uuid, company_code` | Control Plane metadata / registry |
| `control_company_databases` | 0 | `id, company_id, company_code` | Control Plane metadata / registry |
| `control_psv_configs` | 1 | `id, company_id, company_code` | Control Plane metadata / registry |
| `control_users` | 0 | `id, uuid, username` | Control Plane metadata / registry |
| `database_profiles` | 1 | `id, database_name, environment_type` | Control Plane metadata / registry |
| `identity_rules` | 0 | `id, uuid, company_id` | Control Plane metadata / registry |
| `product_identities` | 0 | `id, uuid, company_id` | Control Plane metadata / registry |
| `roles` | 0 | `name, description, permissions_json` | Control Plane metadata / registry |
| `tileflow_audit_log` | 61 | `id, tenant_id, entity_id` | Control Plane metadata / registry |
| `tileflow_menus` | 34 | `id, uuid, company_id` | Control Plane metadata / registry |
| `system_bootstrap_states` | 6 | `id, uuid, tenant_id` | Control Plane metadata / registry |
| `system_configs` | 0 | `id, uuid, company_id` | Control Plane metadata / registry |
| `tenant_provision_profiles` | 2 | `id, tenant_id, setup_version` | Control Plane metadata / registry |
| `tenant_settings` | 2 | `id, tenant_id, language_code` | Control Plane metadata / registry |
| `tenants` | 2 | `id, uuid, tenant_code` | Control Plane metadata / registry |
| `user_company_assignments` | 0 | `id, uuid, company_id` | Control Plane metadata / registry |
| `users` | 1 | `id, uuid, username` | Control Plane metadata / registry |

---

## 3. Company Operational Tables (Company DB Authority)

These tables hold operational transactional state and are partitioned per company:

| Table Name | Source Rows | Discriminator Column | Target Routing | Migration Action |
|---|---|---|---|---|
| `credit_notes` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `customer_addresses` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `customer_channel_preferences` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `customer_contacts` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `customer_credit_profiles` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `customer_groups` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `customer_tax_profiles` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `customers` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `delivery_commission_settlements` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `document_series` | 12 | `company_id` | `tileflow<Code>` | `MIGRATE_TO_COMPANY_DB` |
| `integration_outbox_events` | 140 | `tenant_id / Local` | `tileflow<Code>` | `MIGRATE_TO_COMPANY_DB` |
| `inventory_checkpoint_records` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `inventory_identity_records` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `inventory_ledger_entries` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `inventory_location_nodes` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `inventory_lock_records` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `inventory_snapshot_records` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `invoice_profitability_ledgers` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `journal_ledger_entries` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `journal_vouchers` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `numbering_audit_logs` | 12 | `company_id` | `tileflow<Code>` | `MIGRATE_TO_COMPANY_DB` |
| `pos_offline_sync_queue` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `pos_profiles` | 0 | `tenant_id / Local` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `pos_sessions` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `pos_transaction_items` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `pos_transactions` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `pricing_groups` | 5 | `company_id` | `tileflow<Code>` | `MIGRATE_TO_COMPANY_DB` |
| `product_barcodes` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `product_cost_valuations` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `product_inventory_policies` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `product_tax_profiles` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `product_vendors` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `products` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `purchase_jurisdiction_configs` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `purchase_order_items` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `purchase_orders` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `purchase_receipt_items` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `purchase_receipts` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `purchase_reorder_configs` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `purchase_requisition_lines` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `purchase_requisitions` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `sales_invoice_items` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `sales_invoice_payments` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `sales_invoices` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `sales_order_items` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `sales_orders` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `sales_payments` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `sales_quotation_items` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `sales_quotations` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `sales_return_items` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `sales_returns` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `stock_adjustments` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `stock_bin_assignments` | 0 | `tenant_id / Local` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `stock_count_items` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `stock_counts` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `stock_dispatch_lines` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `stock_dispatches` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `stock_movements` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `stock_transfer_items` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `stock_transfer_shipments` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `stock_transfers` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_addresses` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_bank_details` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_compliance_profiles` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_contacts` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_credit_profiles` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_debit_notes` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_documents` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_gst_registrations` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_logistics` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_payment_profiles` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_payments` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_scorecard_metrics` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_scorecards` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `supplier_tax_profiles` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |
| `suppliers` | 0 | `company_id` | `tileflow<Code>` | `SCHEMA_READY_IN_COMPANY_DB` |

---

## 4. Central Master & Reference Tables (`tileflowsys` Authority)

| Table Name | Source Rows | Purpose | Target Storage |
|---|---|---|---|
| `tileflow_banks` | 20 | Global Static Master | `tileflowsys` |

---

## 5. Party Stock Visibility (PSV) Tables

| Table Name | Source Rows | Purpose | Target Storage | Current Reality |
|---|---|---|---|---|
| `psv_parties` | 0 | PSV Shadow Ledger / Balance | `TileFlowPSV` | Co-located in `tileflowsys` |
| `psv_sku_tracking` | 0 | PSV Shadow Ledger / Balance | `TileFlowPSV` | Co-located in `tileflowsys` |
| `psv_stock_balances` | 1 | PSV Shadow Ledger / Balance | `TileFlowPSV` | Co-located in `tileflowsys` |
| `psv_stock_events` | 1 | PSV Shadow Ledger / Balance | `TileFlowPSV` | Co-located in `tileflowsys` |

---

## 6. Legacy / Retained Inactive Tables

| Table Name | Source Rows | Classification | Status |
|---|---|---|---|
| `apparel_matrix_variants` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `approval_workflow_logs` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `attribute_definitions` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `attribute_groups` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `bank_accounts` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `barcode_layouts` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `blanket_purchase_agreement_lines` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `blanket_purchase_agreements` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `cash_registers` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `category_attribute_group_mappings` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `chart_of_accounts` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `commission_ledgers` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `commission_participants` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `commission_programs` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `commission_rules` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `company_financial_years` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `company_tax_profiles` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `compliance_audit_logs` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `compliance_credentials` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `compliance_outboxes` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `consignment_partners` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `consignment_return_items` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `consignment_returns` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `consignment_sale_report_items` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `consignment_sale_reports` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `consignment_settlements` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `consignment_transfer_items` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `consignment_transfers` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `corporate_gstin_registry` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `cost_centers` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `cost_layer_ledger_entries` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `coupons` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `crm_campaigns` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `crm_customer_activities` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `crm_leads` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `crm_opportunities` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `crm_support_tickets` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `crm_ticket_comments` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `dashboards` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `data_exchange_field_mappings` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `data_exchange_tasks` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `dispatch_approval_events` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `dispatch_items` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `dispatches` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `document_number_series` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `document_posting_profiles` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `document_workflows` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `eway_bills` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `financial_year` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `fiscal_periods` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `fulfillment_waves` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `government_services` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `gst_return_filings` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `gst_return_locks` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `gst_tax_settlements` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `integration_logs` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `landed_cost_vouchers` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `legacy_pos_shifts` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `loyalty_members` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `loyalty_point_transactions` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `loyalty_points_ledgers` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `loyalty_rules` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `loyalty_tiers` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `master_types` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `master_values` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `module_audit_logs` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `module_states` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `organizations` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `packing_slip_items` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `packing_slips` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `pharma_batches` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `pick_list_items` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `pick_lists` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `platform_idempotency_records` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `print_histories` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `print_profiles` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `print_templates` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `procurement_rfq_items` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `procurement_rfq_vendors` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `procurement_rfqs` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `procurement_tolerance_policies` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `promotion_campaigns` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `promotion_redemptions` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `promotion_rules` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `quality_inspection_items` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `quality_inspections` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `quotation_evaluations` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `referral_programs` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `referral_relationships` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `referral_rewards` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `refresh_token_blacklist` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `replenishment_items` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `replenishment_plans` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `requisition_approval_policies` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `requisition_approvals` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `reservation_ledger_entries` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `reverse_logistics_returns` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `scdm_channel_dispatch_lines` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `scdm_channel_dispatches` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `scdm_channel_locations` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `scdm_channel_stock_movements` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `scdm_claim_types` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `scdm_claims` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `scdm_sellout_import_lines` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `scdm_sellout_imports` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `scdm_settlement_lines` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `scdm_settlements` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `shifts` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `shipment_packages` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `size_conversions` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `size_scales` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `size_values` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_addresses` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_api_key_logs` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_api_key_permission_sets` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_api_keys` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_actions` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_assignments` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_comments` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_conditions` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_delegations` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_escalations` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_histories` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_matrices` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_outbox` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_policies` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_requests` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_approval_steps` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_bank_accounts` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_branding` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_comm_channels` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_contacts` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_entity_registry` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_field_security_masks` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_permission_set_permissions` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_permission_sets` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_permissions` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_report_templates` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_role_permission_sets` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_roles` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_security_audits` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_security_policies` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_service_accounts` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_settings` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_social_profiles` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_theme_variants` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_themes` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_user_assignments` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_user_roles` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tileflow_workspace_profiles` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `sre_compliance_decisions` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `sre_rule_engine` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `sre_statutory_ledger` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `stores` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `sync_queue` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tally_configs` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tds_entries` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `tenant_provision_journals` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `terms_clauses` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `terms_defaults` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `terms_snapshots` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `three_way_match_lines` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `three_way_matches` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `transaction_cost_snapshots` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `user_branch_assignments` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `user_store_assignments` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `variant_templates` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `vendor_contract_tiers` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `vendor_contracts` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `vendor_quotation_items` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `vendor_quotations` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `warehouse_bins` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `warehouse_zones` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `warehouses` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
| `workflow_events` | 0 | Legacy / Domain Scaffolding | `RETIRED_IN_TILEFLOWSYS` |
