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

# TILEFLOW CRM, Loyalty & Universal Commission Engine (SICE) Specification v1.0

**Status: CRM_LOYALTY_SICE_ARCHITECTURE_VERIFIED**  
**Audit Timestamp:** 2026-08-15 07:21:44 UTC  
**Official Control Plane DB:** `tileflowsys`  
**Reference Company DB:** `tileflow001`  

---

## 1. Executive Summary & Single Business Database Principle

```text
                    tileflowsys
                 CONTROL PLANE
                       │
       ┌───────────────┼────────────────┐
       │               │                │
   Commission       Loyalty          Module
   Policies         Rules          Entitlements
       │               │                │
       └───────────────┼────────────────┘
                       ▼
                  tileflow001
              BUSINESS SYSTEM OF RECORD
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
       Customers    Loyalty       Commission
       Profile      Members       Ledger
       Groups       Points        Reversals
       History      Ledger        Payouts
```

- **CRM, Loyalty & Commission Database Isolation**: Co-located in `tileflow001`. **Zero extra databases created**.
- **Universal Person Principle**: One person master holds multiple roles (Salesperson, Driver, Referrer, Agent, Dealer, Affiliate, Influencer).
- **Ledger-Based Accounting**: Automatic reversal of Loyalty Points & Commissions on Sales Returns.

---


```text
FINAL STATUS: CRM_LOYALTY_SICE_ARCHITECTURE_VERIFIED
```
