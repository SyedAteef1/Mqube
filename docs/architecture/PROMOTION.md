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

# TILEFLOW Promotion Conflict & Pricing Resolution Specification v1.0

**Status: PROMOTION_CONFLICT_RESOLUTION_VERIFIED**  
**Audit Timestamp:** 2026-08-15 07:37:17 UTC  
**Official Control Plane DB:** `tileflowsys`  
**Reference Company DB:** `tileflow001`  

---

## 1. Promotion Evaluation & Conflict Resolution Pipeline

```text
Cart / Invoice
      ↓
Find Eligible Campaigns
      ↓
Check Customer Eligibility (Customer Group / Loyalty Tier / First Order)
      ↓
Check Channel & Store Applicability
      ↓
Check Product / Category / Brand Eligibility
      ↓
Check Quantity / Minimum Order Amount
      ↓
Evaluate Priority & Exclusivity (Exclusive Override)
      ↓
Apply Stacking & Maximum Discount Cap (50% Cap)
      ↓
Conflict Resolution Strategy (BEST_BENEFIT / HIGHEST_PRIORITY)
      ↓
Apply Final Discount
      ↓
Write Immutable Evaluation Audit Snapshot (evaluated_campaigns_snapshot)
      ↓
Feed into Profitability Net Contribution Engine
```

- **Single Business DB Principle**: Promotion conflict evaluation, stacking rules, priority ranks, and audit snapshots operate inside `tileflow001`. **Zero extra databases created**.

---


```text
FINAL STATUS: PROMOTION_CONFLICT_RESOLUTION_VERIFIED
```
