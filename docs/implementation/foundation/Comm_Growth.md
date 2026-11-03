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

# TILEFLOW Commercial Growth, Customer 360, Operations & Cost Profitability Implementation Plan v1.0

## 1. Objective
Establish complete schema models and architectural data reconciliation across Commercial Growth (CRM, Loyalty, Promotions, Referral, SICE Commissions), Customer 360 Ecosystem, Operations & Fulfillment (Packing Slips, Dispatches, Courier Manifests, Driver Commissions, Reverse Logistics), and Cost & Profitability Intelligence (Multi-Valuation Engine, COGS Snapshots, Net Contribution Waterfall).

## 2. Business Motivation
Provide TILEFLOW with a complete commerce operating system architecture where commercial features, fulfillment flows, and net contribution profitability waterfalls are unified within a single company business database (`tileflow001`) under platform governance (`tileflowsys`).

## 3. Scope
- Co-locate all operational business tables inside `tileflow001`.
- Maintain Control Plane (`tileflowsys`) governance and entitlement rules.
- Support multi-cost price valuations (Purchase Cost, WAC, Last Purchase, FIFO, Landed Cost, Standard Cost, MRP, Replacement Cost).
- Support promotion conflict resolution (Priority, Exclusivity, Stacking rules, 50% cap, evaluation snapshots).

## 4. Current State
- `tileflowsys` holds Control Plane registry & menus (34 frozen records).
- `tileflow001` holds reference company business data for `COMP-001`.

## 5. Gap Analysis
Previously missing operational tables for Promotions conflict resolution, Referral rewards, Driver delivery commissions, Reverse logistics returns, and Multi-valuation COGS snapshots.

## 6. Architecture Impact
Dependencies point inward. Entitlement policies in `tileflowsys`; operational definitions & transactional ledgers in `tileflow001`.

## 7. Proposed Design
Defined 22 SQLAlchemy ORM models across 6 domain model files.

## 8. Files Created
- `backend/app/models/loyalty.py`
- `backend/app/models/commission.py`
- `backend/app/models/promotions.py`
- `backend/app/models/referral.py`
- `backend/app/models/fulfillment.py`
- `backend/app/models/profitability.py`

## 9. Files Modified
- `backend/app/models/__init__.py`
- `TILEFLOW_Control_Plane_Architecture_Review.xlsx`

## 10. Dependencies
SQLAlchemy, PostgreSQL, Pytest, OpenPyXL, Pandas, Vite.

## 11. Risks
Cross-database query leakage avoided by enforcing single business DB co-location in `tileflow001`.

## 12. Rollback Strategy
Git rollback to prior tag if required.

## 13. Verification Plan
- 66 Pytest tests passed.
- Vite build passed.
- Forensic audit scripts verified.

## 14. Test Plan
Pytest test suites in `backend/tests/`.

## 15. Documentation Impact
- Updated Excel workbook review sheet.
- Created architectural markdown specs under `docs/architecture/`.

## 16. Deployment Plan
Sync via Git.

## 17. Status
Completed.

## 18. Related ADRs
ADR-001, ADR-002.

## 19. Related Walkthroughs
[`docs/walkthrough/foundation/Comm_Growth.md`](../../walkthrough/foundation/Comm_Growth.md)
