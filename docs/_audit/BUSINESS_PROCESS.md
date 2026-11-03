<!--
  Project      : TILEFLOW Retail OS
  Author       : Syed Ateef
  Email        : ateef@tileflow.in
  Version      : 3.21.0
  Created      : 2026-08-17
  Modified     : 2026-08-17
  Copyright    : ? tileflow.in. Open Source - Permissive Use
  License      : MIT Open Source License
  Classification: TILEFLOW BUSINESS PROCESS ACCEPTANCE MATRIX (3-DAY TRAINING FLOW)
-->

# TILEFLOW RETAIL OS ? BUSINESS PROCESS ACCEPTANCE MATRIX (3-DAY TRAINING FLOW)

**Evaluation Framework:** 3-Day User Training Lifecycle Functional Acceptance Matrix  
**Canonical Architecture Reference:** [`docs/architecture/MULTI_COMPANY_2.md`](file:///F:/SMRITRretailNX/docs/architecture/MULTI_COMPANY_2.md)  
**Date:** 2026-08-17  
**Official Status:** **`FUNCTIONAL SMOKE & ACCEPTANCE MATRIX VERIFIED`**

---

## 1. Executive Summary

| Training Day | Target Domain Area | Processes Audited | Implemented & Runtime Verified | Implemented & Not Runtime Verified |
|---|---|---|---|---|
| **Day 1: Master Setup** | Items, Suppliers, Customers | 3 / 3 | 3 | 0 |
| **Day 2: Procurement & Stock** | PO, GRN, Stock Audit, Invoices | 6 / 6 | 5 | 1 (Short/Excess Variance) |
| **Day 3: Sales, GST & Logistics** | Sales, Invoices, GST, E-Way, Print | 7 / 7 | 6 | 1 (E-Way Sandbox vs Live) |
| **TOTAL** | **Full Retail Lifecycle** | **16 / 16** | **14 (87.5%)** | **2 (12.5%)** |

---

## 2. Granular Process Acceptance Matrix

| Day | Business Process Step | Target Database | Authoritative Table | Backend API / Service | Acceptance Status | Literal Evidence / Test |
|---|---|---|---|---|---|---|
| **Day 1** | **Item Master Creation** | `tileflow<Code>` | `products` | `app/api/v1/inventory.py` | **IMPLEMENTED + RUNTIME VERIFIED** | `test_inventory.py` (PASS) |
| **Day 1** | **Supplier Master Setup** | `tileflow<Code>` | `suppliers` | `app/api/v1/purchase.py` | **IMPLEMENTED + RUNTIME VERIFIED** | `test_purchase.py` (PASS) |
| **Day 1** | **Customer Master Onboarding** | `tileflow<Code>` | `customers` | `app/api/v1/sales.py` | **IMPLEMENTED + RUNTIME VERIFIED** | `test_sales.py` (PASS) |
| **Day 2** | **Purchase Order (PO)** | `tileflow<Code>` | `purchase_orders` | `PurchaseService.create_po` | **IMPLEMENTED + RUNTIME VERIFIED** | `test_purchase.py` (PASS) |
| **Day 2** | **Goods Receipt Note (GRN)** | `tileflow<Code>` | `stock_movements` | `StockMovementService.inward` | **IMPLEMENTED + RUNTIME VERIFIED** | `test_inventory.py` (PASS) |
| **Day 2** | **Short / Excess Receipt** | `tileflow<Code>` | `stock_movements` | Variance ledger handler | **IMPLEMENTED + NOT RUNTIME VERIFIED** | Unit logic present; manual hardware staging pending |
| **Day 2** | **Stock Verification & Ledger** | `tileflow<Code>` | `stock_movements` | Ledger reconciliation | **IMPLEMENTED + RUNTIME VERIFIED** | `test_inventory.py` (PASS) |
| **Day 2** | **Purchase Invoice** | `tileflow<Code>` | `purchase_invoices` | `PurchaseInvoiceService` | **IMPLEMENTED + RUNTIME VERIFIED** | `test_purchase.py` (PASS) |
| **Day 2** | **Purchase Return & Debit Note** | `tileflow<Code>` | `supplier_debit_notes` | Debit note generator | **IMPLEMENTED + RUNTIME VERIFIED** | `test_purchase.py` (PASS) |
| **Day 3** | **Sales Order & POS Billing** | `tileflow<Code>` | `sales_orders`, `pos_sales` | `POSService.checkout` | **IMPLEMENTED + RUNTIME VERIFIED** | `test_pos.py` (PASS) |
| **Day 3** | **GST Tax Calculation** | `tileflow<Code>` | `sales_invoices` | `GSTCalculationEngine` | **IMPLEMENTED + RUNTIME VERIFIED** | `t_sales_contract.py` (PASS) |
| **Day 3** | **Tax Invoice Generation** | `tileflow<Code>` | `sales_invoices` | `SalesInvoiceService` | **IMPLEMENTED + RUNTIME VERIFIED** | `t_sales_contract.py` (PASS) |
| **Day 3** | **PDF & Label Print Generation** | Memory / Client | `print_jobs` | `PrintService` (PDF stream) | **IMPLEMENTED + RUNTIME VERIFIED (Software)** | PDF generator test PASS; physical printer pending |
| **Day 3** | **E-Way Bill Scaffolding** | `tileflow<Code>` | `eway_bills` | `EWayBillService` | **IMPLEMENTED + NOT RUNTIME VERIFIED** | NIC sandbox credentials pending |
| **Day 3** | **Dispatch & Fulfillment** | `tileflow<Code>` | `dispatches` | `DispatchService` | **IMPLEMENTED + RUNTIME VERIFIED** | `test_sales.py` (PASS) |
| **Day 3** | **Sales Return & Credit Note** | `tileflow<Code>` | `sales_returns` | `SalesReturnService` | **IMPLEMENTED + RUNTIME VERIFIED** | `test_exchange.py` (PASS) |

---

## 3. Training Flow Verification Summary

The complete standard retail lifecycle from Day 1 item onboarding to Day 3 invoice, dispatch, and return is functional and verifies company-local transactional routing into `tileflow<Code>`.
