export type BundleType   = "FIXED_BUNDLE" | "COMBO_DISCOUNT" | "BUY_X_GET_Y";
export type BundleStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

export interface BundleComponent {
  sku:         string;
  productName: string;
  mrp:         number;
  requiredQty: number;
  freeQty?:    number;   // Only for BUY_X_GET_Y
}

export interface BundleConfig {
  bundleId:     string;
  bundleCode:   string;
  name:         string;
  description:  string;
  type:         BundleType;
  components:   BundleComponent[];
  discountPct?: number;   // For COMBO_DISCOUNT
  flatDiscount?: number;  // Alternative flat ₹ off
  fixedPrice?:  number;   // For FIXED_BUNDLE — overrides component sum
  validFrom:    string;
  validTo:      string;
  status:       BundleStatus;
  branchCodes?: string[];   // Empty = all branches
}

export interface BundlePricing {
  bundleId:       string;
  bundleCode:     string;
  name:           string;
  type:           BundleType;
  componentLines: Array<{
    sku:          string;
    productName:  string;
    mrp:          number;
    qty:          number;
    freeQty:      number;
    lineTotal:    number;
    effectivePrice: number;
  }>;
  sumMRP:         number;
  discountAmt:    number;
  bundlePrice:    number;
  savingsPct:     number;
  eligible:       boolean;
  ineligibleSkus: string[];
}

export interface CartItem {
  sku:        string;
  productName: string;
  mrp:        number;
  qty:        number;
  availableQty: number;
}

export interface BundleCartResult {
  appliedBundle:   BundleConfig;
  pricing:         BundlePricing;
  updatedCart:     CartItem[];
  bundleLineItems: BundlePricing["componentLines"];
  totalSavings:    number;
}

export class BundlingEngine {
  private static bundleCounter = 1;

  public static createBundle(params: Omit<BundleConfig, "bundleId" | "bundleCode" | "status"> & { status?: BundleStatus }): BundleConfig {
    return {
      ...params,
      bundleId:   `BNDID-${Date.now()}`,
      bundleCode: `BND-${String(this.bundleCounter++).padStart(5, "0")}`,
      status:     params.status ?? "ACTIVE",
    };
  }

  /** Compute bundle pricing from component MRPs and available cart stock */
  public static computePricing(bundle: BundleConfig, cart: CartItem[]): BundlePricing {
    const ineligibleSkus: string[] = [];

    const componentLines = bundle.components.map((comp) => {
      const cartItem = cart.find((c) => c.sku === comp.sku);
      const available = cartItem?.availableQty ?? 0;

      if (available < comp.requiredQty) {
        ineligibleSkus.push(comp.sku);
      }

      const freeQty  = bundle.type === "BUY_X_GET_Y" ? (comp.freeQty ?? 0) : 0;
      const billedQty = comp.requiredQty;   // free qty doesn't add to price
      const lineTotal = Math.round(comp.mrp * billedQty * 100) / 100;

      return {
        sku:          comp.sku,
        productName:  comp.productName,
        mrp:          comp.mrp,
        qty:          comp.requiredQty,
        freeQty,
        lineTotal,
        effectivePrice: comp.mrp,   // refined below
      };
    });

    const sumMRP = Math.round(componentLines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    const eligible = ineligibleSkus.length === 0;

    let bundlePrice: number;
    let discountAmt: number;

    if (bundle.type === "FIXED_BUNDLE" && bundle.fixedPrice !== undefined) {
      bundlePrice  = bundle.fixedPrice;
      discountAmt  = Math.round((sumMRP - bundlePrice) * 100) / 100;
    } else if (bundle.flatDiscount !== undefined) {
      discountAmt  = bundle.flatDiscount;
      bundlePrice  = Math.round((sumMRP - discountAmt) * 100) / 100;
    } else {
      const pct    = bundle.discountPct ?? 0;
      discountAmt  = Math.round((sumMRP * pct / 100) * 100) / 100;
      bundlePrice  = Math.round((sumMRP - discountAmt) * 100) / 100;
    }

    // For BUY_X_GET_Y: free items are priced at 0
    const refinedLines = componentLines.map((l) => {
      if (bundle.type === "BUY_X_GET_Y" && l.freeQty > 0) {
        const billedQty  = l.qty;
        const totalQty   = billedQty + l.freeQty;
        const effPrice   = totalQty > 0 ? Math.round((l.lineTotal / totalQty) * 100) / 100 : l.mrp;
        return { ...l, qty: totalQty, effectivePrice: effPrice };
      }
      const effPrice = sumMRP > 0 ? Math.round((l.lineTotal / sumMRP * bundlePrice / l.qty) * 100) / 100 : l.mrp;
      return { ...l, effectivePrice: effPrice };
    });

    const savingsPct = sumMRP > 0 ? Math.round((discountAmt / sumMRP) * 10000) / 100 : 0;

    return {
      bundleId:       bundle.bundleId,
      bundleCode:     bundle.bundleCode,
      name:           bundle.name,
      type:           bundle.type,
      componentLines: refinedLines,
      sumMRP,
      discountAmt,
      bundlePrice,
      savingsPct,
      eligible,
      ineligibleSkus,
    };
  }

  /** Validate bundle is active and within validity dates */
  public static isValid(bundle: BundleConfig, asOf: Date = new Date(), branchCode?: string): boolean {
    if (bundle.status !== "ACTIVE") return false;
    const asOfMs = asOf.getTime();
    if (asOfMs < new Date(bundle.validFrom).getTime()) return false;
    if (asOfMs > new Date(bundle.validTo).getTime()) return false;
    if (bundle.branchCodes && bundle.branchCodes.length > 0 && branchCode) {
      if (!bundle.branchCodes.includes(branchCode)) return false;
    }
    return true;
  }

  /** Apply bundle to cart — deduct component quantities, return updated cart + line items */
  public static applyBundleToCart(
    bundle: BundleConfig,
    cart: CartItem[],
    asOf: Date = new Date(),
    branchCode?: string
  ): BundleCartResult {
    if (!this.isValid(bundle, asOf, branchCode)) {
      throw new Error(`Bundle ${bundle.bundleCode} is not valid for this date/branch.`);
    }

    const pricing = this.computePricing(bundle, cart);
    if (!pricing.eligible) {
      throw new Error(`Bundle ${bundle.bundleCode} cannot be applied — insufficient stock for: ${pricing.ineligibleSkus.join(", ")}`);
    }

    // Deduct component quantities from cart
    const updatedCart = cart.map((item) => {
      const comp = bundle.components.find((c) => c.sku === item.sku);
      if (!comp) return item;
      const totalDeduct = comp.requiredQty + (bundle.type === "BUY_X_GET_Y" ? (comp.freeQty ?? 0) : 0);
      return { ...item, qty: item.qty + totalDeduct, availableQty: item.availableQty - totalDeduct };
    });

    const totalSavings = pricing.discountAmt;

    return {
      appliedBundle:   bundle,
      pricing,
      updatedCart,
      bundleLineItems: pricing.componentLines,
      totalSavings,
    };
  }

  /** Find all valid bundles applicable to the cart's SKUs */
  public static findApplicableBundles(
    bundles: BundleConfig[],
    cart: CartItem[],
    asOf: Date = new Date(),
    branchCode?: string
  ): Array<{ bundle: BundleConfig; pricing: BundlePricing }> {
    const cartSkus = new Set(cart.map((c) => c.sku));
    return bundles
      .filter((b) => {
        if (!this.isValid(b, asOf, branchCode)) return false;
        return b.components.every((c) => cartSkus.has(c.sku));
      })
      .map((b) => ({ bundle: b, pricing: this.computePricing(b, cart) }))
      .filter((r) => r.pricing.eligible)
      .sort((a, b) => b.pricing.discountAmt - a.pricing.discountAmt);
  }
}

export default BundlingEngine;
