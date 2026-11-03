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

# TILEFLOW Cost & Profitability Intelligence Specification v1.0

**Status: COST_PROFITABILITY_INTELLIGENCE_VERIFIED**  
**Audit Timestamp:** 2026-08-15 07:31:29 UTC  
**Official Control Plane DB:** `tileflowsys`  
**Reference Company DB:** `tileflow001`  

---

## 1. Profitability Waterfall Engine Architecture

```text
Invoice Gross Sales
   │
   ├── COGS (WAC / FIFO / Landed Cost)
   │     │
   │     ▼
   ├── Gross Profit
   │     │
   │     ├── Salesperson Commission
   │     ├── Driver Commission
   │     ├── Promotion Discount
   │     ├── Loyalty Cost
   │     ├── Referral Cost
   │     └── Delivery Cost
   │           │
   └───────────┼───────────► Net Contribution
```

- **Single Business DB Principle**: Multi-valuation cost prices, COGS snapshots, and Net Contribution waterfall ledgers reside inside `tileflow001`. **Zero extra databases created**.

---


```text
FINAL STATUS: COST_PROFITABILITY_INTELLIGENCE_VERIFIED
```
