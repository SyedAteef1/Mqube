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

# TILEFLOW Commercial Growth Engine - Promotions & Campaigns Specification v1.0

**Status: PROMOTIONS_GROWTH_ENGINE_VERIFIED**  
**Audit Timestamp:** 2026-08-15 07:23:47 UTC  
**Official Control Plane DB:** `tileflowsys`  
**Reference Company DB:** `tileflow001`  

---

## 1. Executive Summary & Growth Ecosystem Co-Location

```text
                    tileflowsys
                 CONTROL PLANE
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Promotion     Loyalty      Commission
        Policies     Policies       Rules
          │            │            │
          └────────────┼────────────┘
                       ▼
                  tileflow001
             BUSINESS SYSTEM OF RECORD
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    Promotion       Loyalty        Incentives
    Campaigns       Members        Commissions
```

- **Single Business DB Principle**: Promotions, CRM, Loyalty & SICE Commissions co-located inside `tileflow001`. **Zero extra databases created**.
- **Immutable Invoice Snapshot**: Invoice retains an immutable snapshot (`rule_snapshot`) of applied promotion & coupon at transaction time.

---


```text
FINAL STATUS: PROMOTIONS_GROWTH_ENGINE_VERIFIED
```
