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

# 03. Phase 3 — Config-Driven One-to-Many Alias Registry Design

---

## 1. Objectives

1. **One-to-Many Mapping Support**: Enable a single source spreadsheet column (e.g. `BARCODE`) to populate both its primary target (`barcode`) and secondary conditional targets (e.g. `sku` when `sku_mode === 'BARCODE'`).
2. **Backward Compatibility**: All existing 1-to-1 mappings continue functioning without changes.
3. **Fuzzy-Match Safety**: All fuzzy and alias matches are surfaced in the mandatory **Preview & Review Step** and never committed silently.

---

## 2. Configuration Schema

```typescript
export interface ConditionalTarget {
  target: string;
  targetLabel?: string;
  condition?: string; // Predicate expression e.g. "sku_mode === 'BARCODE'"
  transform?: 'identity' | 'uppercase' | 'trim' | 'number';
}

export interface TileFlowFieldDefinition {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
  description?: string;
  additionalTargets?: ConditionalTarget[];
}
```

---

## 3. Mapping Configuration Table

| Source Header Aliases | Primary Target | Additional Targets (Conditional) | Condition / Transform |
| :--- | :--- | :--- | :--- |
| `BARCODE`, `EAN`, `UPC` | `barcode` | `sku` | `sku_mode === 'BARCODE'` (`identity`) |
| `STYLE/Article CODE`, `STYLE CODE` | `styleCode` | `code` | `sku_mode === 'SHEET'` (`identity`) |
| `MRP`, `MAX RETAIL PRICE` | `mrp` | `price` | `price == null || price == 0` (`identity`) |
| `COLOUR`, `COLOR`, `SHADE` | `colour` | `color` | Unconditional (`identity`) |
