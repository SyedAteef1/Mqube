/**
 * Project      : MQube Retail OS
 * Author       : Syed Ateef
 * Designation  : Chief Systems Architect & Creator
 * Email        : ateef@tileflow.in
 * Version      : 6.17.0
 * Created      : 2026-08-21
 * Modified     : 2026-08-25
 * Copyright    : Â tileflow.in. Open Source - Permissive Use
 * License      : MIT Open Source License
 * Classification: Open Source
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  ProPosCartItem, 
  ProPosCustomer, 
  ProPosTenderSplit, 
  SuspendedBill, 
  CancelledBillRecord,
  ReturnItem,
  POSZReportData,
  ShiftCashMovementRecord
} from "./types.ts";
import { TileFlowPosSettlement } from "./ProPosSettlementDl.tsx";
import { TileFlowProPosRecallDlg } from "./ProPosRecallDlg.tsx";
import { TileFlowProPosCancelDlg } from "./ProPosCancellation.tsx";
import { TileFlowLoyaltyLookupDlgpModal } from "./ProPosLoyaltyLooku.tsx";
import { TileFlowProPosSalesReturnModal } from "./ProPosSalesReturnD.tsx";
import { TileFlowProPosTaxInvoiceReceipt } from "./ProPosTaxInvoiceRc.tsx";
import { TileFlowPdtImportDlg } from "./ProPosPdtImportDlg.tsx";
import { TileFlowCustomerBrowseModal } from "./CustBrowseDlg.tsx";
import { TileFlowProPosHotkeysDlg } from "./ProPosHotkeysDlg.tsx";
import { TileFlowProPosReprintDlg } from "./ProPosReprintDlg.tsx";
import { TileFlowProPosCashMovementsModal } from "./ProPosCashMovesDlg.tsx";
import { TileFlowProPosShiftCloseModal } from "./ProPosShiftCloseDl.tsx";
import { apiFetchV1 } from "../../../lib/apiFetchV1.ts";
import { calculateGST, parseAndValidateGSTIN, GST_STATE_MAP } from "../../../utils/gstEngine.ts";
import { searchBackendProducts, AutoPopulateProductResult } from "../../../services/autoPopulateService.ts";
import { TileFlowItemTypeaheadDropdown } from "../../common/ItemTypeaheadDrop.tsx";
import { 
  Barcode, 
  Search, 
  History, 
  Award, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  CheckCircle, 
  AlertCircle, 
  User, 
  X,
  RotateCcw,
  ShieldAlert,
  Pause,
  Play,
  CornerDownLeft,
  UploadCloud,
  FileSpreadsheet,
  Calendar,
  Clock,
  ChevronRight,
  FilePlus,
  HelpCircle,
  Calculator,
  RefreshCw,
  Vault,
  Lock,
  ChevronDown
} from "lucide-react";

interface TileFlowProPosBillinginalProps {
  onNotification?: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export const TileFlowProPosBillinginal: React.FC<TileFlowProPosBillinginalProps> = ({
  onNotification
}) => {
  // --- POS Mode & Activity State ---
  const [activeActivity, setActiveActivity] = useState<"BILLING" | "RETURN" | "RETURN_BLIND">("BILLING");

  // --- Header Group State ---
  const [billType, setBillType] = useState<"Product" | "Service">("Product");
  const [transactionType, setTransactionType] = useState<"Cash" | "Credit">("Cash");
  const [billDocPrefix, setBillDocPrefix] = useState<string>("INV");
  const [billDocNumber, setBillDocNumber] = useState<string>("84920");
  const [currentDateTime, setCurrentDateTime] = useState<string>(() => {
    const d = new Date();
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  });

  const [customer, setCustomer] = useState<ProPosCustomer>({
    id: "cust-01",
    code: "C01",
    name: "Walk-in Customer",
    phone: "",
    loyaltyPoints: 1200,
    loyaltyTier: "Gold",
    creditLimit: 50000,
    currentBalance: 0
  });

  const storeStateCode = "27"; // Maharashtra store default

  const gstAnalysis = useMemo(() => {
    return parseAndValidateGSTIN(customer.gstin);
  }, [customer.gstin]);

  const isB2B = Boolean(customer.gstin && gstAnalysis.isValid);
  const posStateCode = gstAnalysis.stateCode || customer.stateCode || storeStateCode;
  const posStateName = gstAnalysis.stateName || customer.state || GST_STATE_MAP[posStateCode] || "Home State";
  const isInterstate = storeStateCode !== posStateCode;

  const [salesStaff, setSalesStaff] = useState<string>("");
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(1);
  const [showTotalsPanel, setShowTotalsPanel] = useState<boolean>(true);
  const [showMoreColumns, setShowMoreColumns] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  // --- Detail Group: Accepted Item Details Grid State ---
  const [cartItems, setCartItems] = useState<ProPosCartItem[]>([]);

  // --- Detail Group: Direct Entry Grid State ---
  const [directBarcode, setDirectBarcode] = useState<string>("");
  const [directStockNo, setDirectStockNo] = useState<string>("");
  const [directDescription, setDirectDescription] = useState<string>("");
  const [directRate, setDirectRate] = useState<string>("");
  const [directQty, setDirectQty] = useState<string>("1.00");
  const [directSqft, setDirectSqft] = useState<string>("");
  const [salesPeople, setSalesPeople] = useState<string[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [dispatchFrom, setDispatchFrom] = useState("");
  const [catalog, setCatalog] = useState<Record<string, { name: string; price: number; gst: number; sqftPerBox: number }>>({});

  useEffect(() => {
    apiFetchV1<any[]>("/staff/personnel?role=SALESPERSON")
      .then(people => setSalesPeople((people || []).map(p => p.person_name).filter(Boolean)))
      .catch(() => setSalesPeople([]));
    apiFetchV1<any[]>("/wms/warehouses").then(setLocations).catch(() => setLocations([]));
    apiFetchV1<any>("/products?page_size=100")
      .then(res => {
        const list: any[] = Array.isArray(res) ? res : res?.items || [];
        setCatalog(Object.fromEntries(list.map(p => [p.code, {
          name: p.name,
          price: Number(p.price || 0),
          gst: Number(p.gst_percentage ?? 18),
          sqftPerBox: Number(p.sqft_per_box || 0)
        }])));
      })
      .catch(() => setCatalog({}));
  }, []);
  const [directDiscCode, setDirectDiscCode] = useState<string>("");
  const [directDiscQty, setDirectDiscQty] = useState<string>("1.00");
  const [directDiscPct, setDirectDiscPct] = useState<string>("0.00");
  const [directDiscAmtInput, setDirectDiscAmtInput] = useState<string>("0.00");
  const [directStaff, setDirectStaff] = useState<string>("SM1");

  // Live Item Typeahead / Auto-Populate State
  const [productSuggestions, setProductSuggestions] = useState<AutoPopulateProductResult[]>([]);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState<boolean>(false);
  const [isProductSearching, setIsProductSearching] = useState<boolean>(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState<number>(0);
  const [activeSearchField, setActiveSearchField] = useState<"stockNo" | "barcode">("stockNo");
  const [selectedProductMeta, setSelectedProductMeta] = useState<AutoPopulateProductResult | null>(null);

  const directStockNoRef = useRef<HTMLInputElement | null>(null);
  const directBarcodeRef = useRef<HTMLInputElement | null>(null);
  const searchDebounceTimer = useRef<any>(null);

  // Debounced Universal Product Lookup from Barcode or Stock No
  const handleItemLiveSearch = (query: string, fieldType: "stockNo" | "barcode") => {
    setActiveSearchField(fieldType);
    if (!query.trim()) {
      setProductSuggestions([]);
      setIsProductSearchOpen(false);
      return;
    }

    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    setIsProductSearching(true);
    searchDebounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchBackendProducts(query);
        setProductSuggestions(results);
        setIsProductSearchOpen(results.length > 0);
        setSelectedSuggestionIdx(0);
      } catch (err) {
        console.warn("Item search failed", err);
      } finally {
        setIsProductSearching(false);
      }
    }, 150);
  };

  // Select Item from Dropdown / Autocomplete
  const handleSelectProductSuggestion = (item: AutoPopulateProductResult) => {
    setDirectStockNo(item.stockNo || item.code);
    setDirectBarcode(item.barcode);
    setDirectDescription(item.name);
    const unitP = item.sellingPrice ? item.sellingPrice.toFixed(2) : (item.mrp || 0).toFixed(2);
    handleRateOrQtyChange(unitP, directQty);
    setSelectedProductMeta(item);
    setIsProductSearchOpen(false);
    onNotification?.("Item Identified", `${item.name} (Stock No: ${item.stockNo || item.code}, Barcode: ${item.barcode}) loaded.`, "info");
  };

  // Direct Entry Computed Values
  const directValue = useMemo(() => {
    const rate = parseFloat(directRate) || 0;
    const qty = parseFloat(directQty) || 0;
    return rate * qty;
  }, [directRate, directQty]);

  // Helper to determine effective discountable quantity (Disc Qty)
  const getEffectiveDiscQty = (dQtyStr: string, totalQtyStr: string) => {
    if (dQtyStr.trim() !== "") {
      const parsed = parseFloat(dQtyStr);
      return isNaN(parsed) ? 0 : parsed;
    }
    const totalQ = parseFloat(totalQtyStr) || 0;
    return totalQ;
  };

  // Handle Disc Qty input change (triggers Disc.Amt recalculation based on Disc. %)
  const handleDiscQtyChange = (dQtyStr: string) => {
    setDirectDiscQty(dQtyStr);
    const effDiscQ = getEffectiveDiscQty(dQtyStr, directQty);
    const rate = parseFloat(directRate) || 0;
    const pct = parseFloat(directDiscPct) || 0;
    const computedAmt = (rate * effDiscQ * pct) / 100;
    setDirectDiscAmtInput(computedAmt.toFixed(2));
  };

  // Handle Disc % input change (computes and updates Disc.Amt based on Disc Qty)
  const handleDiscPctChange = (pctStr: string) => {
    setDirectDiscPct(pctStr);
    const pct = parseFloat(pctStr) || 0;
    const rate = parseFloat(directRate) || 0;
    const effDiscQ = getEffectiveDiscQty(directDiscQty, directQty);
    const computedAmt = (rate * effDiscQ * pct) / 100;
    setDirectDiscAmtInput(computedAmt.toFixed(2));
  };

  // Handle Disc.Amt input change (computes and updates Disc. % based on Disc Qty)
  const handleDiscAmtChange = (amtStr: string) => {
    setDirectDiscAmtInput(amtStr);
    const amt = parseFloat(amtStr) || 0;
    const rate = parseFloat(directRate) || 0;
    const effDiscQ = getEffectiveDiscQty(directDiscQty, directQty);
    const baseVal = rate * effDiscQ;

    if (baseVal > 0) {
      const computedPct = (amt / baseVal) * 100;
      setDirectDiscPct(computedPct.toFixed(2));
    } else {
      setDirectDiscPct("0.00");
    }
  };

  // Handle Rate or Qty changes
  const handleRateOrQtyChange = (newRate: string, newQty: string) => {
    setDirectRate(newRate);
    setDirectQty(newQty);
    const r = parseFloat(newRate) || 0;
    // If discQty was previously matching the old qty, update it
    let dQty = directDiscQty;
    if (directDiscQty === "" || directDiscQty === directQty) {
      dQty = newQty;
      setDirectDiscQty(newQty);
    }
    const effDiscQ = getEffectiveDiscQty(dQty, newQty);
    const pct = parseFloat(directDiscPct) || 0;
    setDirectDiscAmtInput(((r * effDiscQ * pct) / 100).toFixed(2));
  };

  const directDiscAmt = parseFloat(directDiscAmtInput) || 0;
  const directTotal = useMemo(() => {
    return Math.max(0, directValue - directDiscAmt);
  }, [directValue, directDiscAmt]);

  // --- Suspended Bills & Recalls State ---
  const [suspendedBills, setSuspendedBills] = useState<SuspendedBill[]>([]);

  // --- Modals State ---
  const [showSettlementModal, setShowSettlementModal] = useState<boolean>(false);
  const [showRecallModal, setShowRecallModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState<boolean>(false);
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showPdtImportModal, setShowPdtImportModal] = useState<boolean>(false);
  const [showCustomerBrowseModal, setShowCustomerBrowseModal] = useState<boolean>(false);
  const [showHotkeysModal, setShowHotkeysModal] = useState<boolean>(false);
  const [showReprintModal, setShowReprintModal] = useState<boolean>(false);
  const [showCashMovementsModal, setShowCashMovementsModal] = useState<boolean>(false);
  const [showShiftCloseModal, setShowShiftCloseModal] = useState<boolean>(false);
  const [activeShiftId, setActiveShiftId] = useState<string>("shift-01");
  const [activeShiftCode, setActiveShiftCode] = useState<string>("REG-01 / SHIFT-CURRENT");

  // Fetch active shift on load
  useEffect(() => {
    let isMounted = true;
    const fetchActiveShift = async () => {
      try {
        const shifts = await apiFetchV1<any[]>("/pos/shifts/");
        if (isMounted && shifts && shifts.length > 0) {
          const openShift = shifts.find((s: any) => s.status === "OPEN") || shifts[0];
          setActiveShiftId(openShift.id);
          setActiveShiftCode(openShift.shift_code || `REG-01 / SHIFT-${openShift.id.slice(-6).toUpperCase()}`);
        }
      } catch (e) {
        // Fallback default shift ID
      }
    };
    fetchActiveShift();
    return () => {
      isMounted = false;
    };
  }, []);

  // Last Completed Invoice for Tax Printing
  const [lastCompletedBill, setLastCompletedBill] = useState<{
    billNo: string;
    billDate: string;
    customer: ProPosCustomer;
    salesStaff: string;
    items: ProPosCartItem[];
    subTotal: number;
    discountTotal: number;
    taxTotal: number;
    netPayable: number;
    tenders?: ProPosTenderSplit;
    changeDue?: number;
  } | null>(null);

  // Live timer for header clock
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentDateTime(`${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Focus direct entry input on mount
  useEffect(() => {
    directStockNoRef.current?.focus();
  }, []);

  // --- Footer Totals Calculations ---
  const totalItemsCount = cartItems.length;
  const totalQuantity = useMemo(() => cartItems.reduce((acc, it) => acc + it.qty, 0), [cartItems]);
  const grossSalesValue = useMemo(() => cartItems.reduce((acc, it) => acc + (it.qty * it.unitPrice), 0), [cartItems]);
  const itemDiscountsTotal = useMemo(() => cartItems.reduce((acc, it) => acc + it.discountAmt, 0), [cartItems]);
  const totalTaxAmount = useMemo(() => {
    return cartItems.reduce((acc, it) => {
      const gst = calculateGST({
        unitPrice: it.unitPrice,
        quantity: it.qty,
        discountAmount: it.discountAmt,
        gstRate: it.taxPct ?? 18,
        isTaxInclusive: it.isTaxInclusive ?? !isB2B,
        isInterstate: isInterstate,
      });
      return acc + gst.taxAmount;
    }, 0);
  }, [cartItems, isB2B, isInterstate]);
  const exactBillAmount = useMemo(() => {
    const raw = cartItems.reduce((acc, it) => {
      const gst = calculateGST({
        unitPrice: it.unitPrice,
        quantity: it.qty,
        discountAmount: it.discountAmt,
        gstRate: it.taxPct ?? 18,
        isTaxInclusive: it.isTaxInclusive ?? !isB2B,
        isInterstate: isInterstate,
      });
      return acc + gst.totalAmount;
    }, 0);
    return Math.round(raw * 100) / 100;
  }, [cartItems, isB2B, isInterstate]);
  // Round to the nearest rupee, as the server does when the bill is saved.
  const netPayableAmount = Math.round(exactBillAmount);
  const roundOffAmount = Math.round((netPayableAmount - exactBillAmount) * 100) / 100;

  // Create New Bill (Alt+1)
  const handleNewBill = () => {
    setCartItems([]);
    setCustomer({
      id: "cust-01",
      code: "C01",
      name: "Walk-in Customer",
      phone: "",
      loyaltyPoints: 1200,
      loyaltyTier: "Gold",
      creditLimit: 50000,
      currentBalance: 0
    });
    setDirectStockNo("");
    setDirectDescription("");
    setDirectQty("1.00");
    setDirectSqft("");
    setDirectDiscQty("1.00");
    setDirectDiscPct("0.00");
    setDirectDiscAmtInput("0.00");
    setActiveActivity("BILLING");
    directStockNoRef.current?.focus();
    onNotification?.("New Bill Created", "Terminal reset for new billing transaction [Alt+1].", "info");
  };

  // Stock No / Barcode Lookup
  const handleDirectStockNoLookup = async (code: string) => {
    if (!code.trim()) return;
    const term = code.trim();

    try {
      const resp = await apiFetchV1<any>(`/products/search?q=${encodeURIComponent(term)}&limit=1`);
      const items = Array.isArray(resp) ? resp : (resp?.items || []);
      if (items.length > 0) {
        const p = items[0];
        setDirectDescription(p.product_name || p.name || `Retail Item ${term}`);
        const unitP = (parseFloat(p.selling_price || p.mrp || p.price) || 0).toFixed(2);
        handleRateOrQtyChange(unitP, directQty);
        return;
      }
    } catch (e) {
      console.warn("Direct lookup fallback to auto-generated details", e);
    }

  };

  // Keyboard navigation helper for Typeahead dropdown
  const handleItemInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, fieldType: "stockNo" | "barcode") => {
    if (isProductSearchOpen && productSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIdx(prev => (prev + 1) % productSuggestions.length);
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIdx(prev => (prev - 1 + productSuggestions.length) % productSuggestions.length);
        return;
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = productSuggestions[selectedSuggestionIdx];
        if (selected) {
          handleSelectProductSuggestion(selected);
        } else {
          handleAcceptDirectEntryItem();
        }
        return;
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsProductSearchOpen(false);
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (productSuggestions.length === 1 && isProductSearchOpen) {
        handleSelectProductSuggestion(productSuggestions[0]);
      } else {
        handleAcceptDirectEntryItem();
      }
    }
  };

  // Accept Item from Direct Entry Grid into Item Details Grid
  const handleAcceptDirectEntryItem = () => {
    if (!directStockNo.trim() && !directBarcode.trim()) {
      onNotification?.("Stock No / Barcode Required", "Please enter a Stock No or scan a barcode.", "error");
      directStockNoRef.current?.focus();
      return;
    }

    if (transactionType === "Credit" && (!customer.code || customer.code === "C01" && customer.name.includes("Walk-in"))) {
      onNotification?.("Customer Required", "Credit billing requires a registered customer account.", "error");
      setShowCustomerBrowseModal(true);
      return;
    }

    const stockCode = directStockNo.trim() || directBarcode.trim();
    const barcodeCode = directBarcode.trim() || selectedProductMeta?.barcode || stockCode;
    const known = catalog[stockCode];
    if (!selectedProductMeta && !known) {
      onNotification?.("Product Not Found", `No product found for "${stockCode}". Pick it from the search list.`, "error");
      directStockNoRef.current?.focus();
      return;
    }
    const desc = directDescription.trim() || selectedProductMeta?.name || known?.name || stockCode;
    const rate = parseFloat(directRate) || selectedProductMeta?.sellingPrice || known?.price || 0;
    const qty = parseFloat(directQty) || 1.00;
    const effDiscQ = getEffectiveDiscQty(directDiscQty, directQty);
    const discPct = parseFloat(directDiscPct) || 0.00;
    const discAmt = parseFloat(directDiscAmtInput) || ((rate * effDiscQ * discPct) / 100);
    const staff = directStaff || salesStaff;
    const gstRate = selectedProductMeta?.gstPercentage ?? known?.gst ?? 18;

    const gstCalc = calculateGST({
      unitPrice: rate,
      quantity: qty,
      discountAmount: discAmt,
      gstRate: gstRate,
      isTaxInclusive: !isB2B,
      isInterstate: isInterstate,
    });

    const existingIndex = cartItems.findIndex(
      it => (it.sku === stockCode || it.barcode === barcodeCode) &&
            it.unitPrice === rate &&
            Math.abs((it.discQty || 0) - effDiscQ) < 0.01 &&
            Math.abs(it.discountPct - discPct) < 0.01 &&
            it.salesStaff === staff &&
            !it.sqftRequested && !directSqft
    );

    if (existingIndex >= 0) {
      setCartItems(prev => {
        const next = [...prev];
        const cur = next[existingIndex];
        const newQty = cur.qty + qty;
        const newDiscQ = (cur.discQty || 0) + effDiscQ;
        const newDiscAmt = (cur.unitPrice * newDiscQ * cur.discountPct) / 100;
        const updatedGst = calculateGST({
          unitPrice: cur.unitPrice,
          quantity: newQty,
          discountAmount: newDiscAmt,
          gstRate: cur.taxPct || gstRate,
          isTaxInclusive: !isB2B,
          isInterstate: isInterstate,
        });
        next[existingIndex] = {
          ...cur,
          qty: newQty,
          discQty: newDiscQ,
          discountAmt: newDiscAmt,
          taxAmt: updatedGst.taxAmount,
          taxableValue: updatedGst.taxableValue,
          cgstAmount: updatedGst.cgstAmount,
          sgstAmount: updatedGst.sgstAmount,
          igstAmount: updatedGst.igstAmount,
          lineTotal: updatedGst.totalAmount
        };
        return next;
      });
      setSelectedRowIndex(existingIndex);
      onNotification?.("Item Clubbed", `Repeated item ${stockCode} clubbed (+${qty.toFixed(2)} qty, ${effDiscQ.toFixed(2)} disc qty).`, "info");
    } else {
      const newItem: ProPosCartItem = {
        id: `item-${Date.now()}`,
        itemNo: cartItems.length + 1,
        sqftRequested: parseFloat(directSqft) > 0 ? parseFloat(directSqft) : undefined,
        sku: stockCode,
        barcode: barcodeCode,
        name: desc,
        size: selectedProductMeta?.size || "",
        color: selectedProductMeta?.color || "",
        brand: selectedProductMeta?.brand || "",
        salesStaff: staff,
        qty: qty,
        mrp: selectedProductMeta?.mrp || rate,
        unitPrice: rate,
        discCode: directDiscCode || "",
        discQty: effDiscQ,
        discountPct: discPct,
        discountAmt: discAmt,
        taxPct: gstRate,
        taxAmt: gstCalc.taxAmount,
        taxableValue: gstCalc.taxableValue,
        cgstAmount: gstCalc.cgstAmount,
        sgstAmount: gstCalc.sgstAmount,
        igstAmount: gstCalc.igstAmount,
        isTaxInclusive: !isB2B,
        lineTotal: gstCalc.totalAmount
      };

      setCartItems(prev => [...prev, newItem]);
      setSelectedRowIndex(cartItems.length);
      onNotification?.("Item Accepted", `${desc} (${stockCode}) accepted (${effDiscQ.toFixed(2)} Disc Qty, ₹${discAmt.toFixed(2)} Disc Amt).`, "success");
    }

    setDirectStockNo("");
    setDirectBarcode("");
    setDirectDescription("");
    setDirectQty("1.00");
    setDirectSqft("");
    setDirectDiscQty("1.00");
    setDirectDiscPct("0.00");
    setDirectDiscAmtInput("0.00");
    setSelectedProductMeta(null);
    setIsProductSearchOpen(false);

    if (activeSearchField === "barcode") {
      directBarcodeRef.current?.focus();
    } else {
      directStockNoRef.current?.focus();
    }
  };

  // Import PDT Items callback
  const handlePdtImportSuccess = (imported: Partial<ProPosCartItem>[]) => {
    // Imported lines are priced exactly like typed ones: no invented discounts, tax or totals.
    const converted: ProPosCartItem[] = imported.map((it, idx) => {
      const qty = it.qty || 1.00;
      const unitPrice = it.unitPrice || 0;
      const discountPct = it.discountPct ?? 0;
      const discountAmt = it.discountAmt ?? (unitPrice * qty * discountPct) / 100;
      const taxPct = it.taxPct ?? 18;
      const gst = calculateGST({
        unitPrice,
        quantity: qty,
        discountAmount: discountAmt,
        gstRate: taxPct,
        isTaxInclusive: !isB2B,
        isInterstate: isInterstate,
      });
      return {
        id: `pdt-${Date.now()}-${idx}`,
        itemNo: cartItems.length + idx + 1,
        sku: it.sku || `SKU-${idx + 1}`,
        barcode: it.barcode || it.sku || `SKU-${idx + 1}`,
        name: it.name || `Imported Item ${it.sku}`,
        size: it.size || "",
        color: it.color || "",
        brand: it.brand || "",
        salesStaff: salesStaff,
        qty,
        mrp: it.mrp || unitPrice,
        unitPrice,
        discCode: "",
        discQty: qty,
        discountPct,
        discountAmt,
        taxPct,
        taxAmt: gst.taxAmount,
        taxableValue: gst.taxableValue,
        cgstAmount: gst.cgstAmount,
        sgstAmount: gst.sgstAmount,
        igstAmount: gst.igstAmount,
        isTaxInclusive: !isB2B,
        lineTotal: gst.totalAmount,
      };
    });

    setCartItems(prev => [...prev, ...converted]);
    onNotification?.("PDT Loaded", `Successfully imported ${converted.length} items from PDT.`, "success");
  };

  // Remove Item from Grid
  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(it => it.id !== id).map((it, idx) => ({ ...it, itemNo: idx + 1 })));
  };

  // Hold / Suspend Current Bill
  const handleHoldBill = () => {
    if (cartItems.length === 0) {
      onNotification?.("Empty Cart", "No items to hold/suspend.", "error");
      return;
    }

    const newSuspended: SuspendedBill = {
      id: `susp-${Date.now()}`,
      billNo: `SUSP-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customer,
      salesStaff,
      items: cartItems,
      itemCount: totalItemsCount,
      totalQty: totalQuantity,
      netAmount: netPayableAmount
    };

    setSuspendedBills(prev => [newSuspended, ...prev]);
    setCartItems([]);
    onNotification?.("Bill Suspended", `Bill ${newSuspended.billNo} suspended to queue.`, "info");
  };

  // Recall Bill
  const handleRecallBill = (bill: SuspendedBill) => {
    setCartItems(bill.items);
    setCustomer(bill.customer);
    setSalesStaff(bill.salesStaff);
    setSuspendedBills(prev => prev.filter(b => b.id !== bill.id));
    onNotification?.("Bill Restored", `Restored bill ${bill.billNo} to terminal.`, "success");
  };

  // Settlement Success
  const handleSettlementSuccess = async (tenders: ProPosTenderSplit, changeDue: number) => {
    const creditAmount = tenders.credit || 0;
    if (creditAmount > 0 && customer.name.includes("Walk-in")) {
      onNotification?.("Customer Required", "Credit billing requires a registered customer account.", "error");
      return;
    }
    let billNumber = billDocNumber;
    try {
      const next = await apiFetchV1<any>(`/sales/invoices/next-number?prefix=${encodeURIComponent(billDocPrefix)}`);
      billNumber = String(next.next_number);
    } catch {
      // Keep the on-screen number; the save below reports any real failure.
    }
    const generatedBillNo = `${billDocPrefix}-${billNumber}`;
    let saved: any;
    try {
      saved = await apiFetchV1<any>("/sales/invoices", {
        method: "POST",
        body: JSON.stringify({
          invoice_no: generatedBillNo,
          date: new Date().toISOString().slice(0, 10),
          customer_id: customer.name.includes("Walk-in") ? null : customer.id,
          customer_name: customer.name,
          customer_gstin: customer.gstin || null,
          status: "Completed",
          warehouse_id: dispatchFrom || undefined,
          payment_mode: "SPLIT",
          paid_amount: netPayableAmount - creditAmount,
          balance_amount: creditAmount,
          net_amount: netPayableAmount,
          grand_total: netPayableAmount,
          salesperson_name: salesStaff,
          items: cartItems.map((item, index) => ({
            code: item.sku,
            product_id: item.sku,
            name: item.name,
            quantity: item.qty,
            price: item.unitPrice,
            gst_rate: item.taxPct,
            disc_pct: item.discountPct,
            sqft_requested: item.sqftRequested,
            line_no: index + 1
          }))
        })
      });
    } catch (err: any) {
      onNotification?.("Bill Not Saved", err.message || "This bill could not be saved.", "error");
      return;
    }

    const tenderRows = [
      { tender_type: "CASH", amount: tenders.cash - changeDue },
      { tender_type: "CARD", amount: tenders.card, auth_code: tenders.cardAuthCode, card_last4: tenders.cardLast4 },
      { tender_type: "UPI", amount: tenders.upi, gateway_reference: tenders.upiRef },
      { tender_type: "CHEQUE", amount: tenders.cheque || 0, cheque_no: tenders.chequeNo, gateway_reference: tenders.chequeNo, bank_name: tenders.chequeBank },
      { tender_type: "CREDIT_NOTE", amount: tenders.creditNote, gateway_reference: tenders.creditNoteNo }
    ].filter(row => row.amount > 0);
    if (tenderRows.length > 0) {
      try {
        await apiFetchV1("/payments/process", {
          method: "POST",
          body: JSON.stringify({
            reference_doc_type: "POS_BILL",
            reference_doc_id: saved.id,
            tenders: tenderRows,
            idempotency_key: `POS-${saved.id}`,
            branch_id: saved.branch_id || "MAIN"
          })
        });
      } catch (paymentError: any) {
        onNotification?.("Payment Not Recorded", paymentError.message || "The bill was saved but its payment details were not.", "error");
      }
    }

    const billRecord = {
      billNo: generatedBillNo,
      billDate: new Date().toISOString().slice(0, 10),
      customer,
      salesStaff,
      items: cartItems,
      subTotal: grossSalesValue,
      discountTotal: itemDiscountsTotal,
      taxTotal: totalTaxAmount,
      netPayable: netPayableAmount,
      tenders,
      changeDue
    };

    setLastCompletedBill(billRecord);
    setShowSettlementModal(false);
    setShowReceiptModal(true);
    setCartItems([]);
    setBillDocNumber(String(parseInt(billNumber) + 1));
    onNotification?.("Invoice Finalized", `Invoice ${generatedBillNo} generated successfully!`, "success");
  };

  // --- Complete Global POS Keyboard Shortcuts ---
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Escape: Close open modals
      if (e.key === "Escape") {
        setShowHotkeysModal(false);
        setShowReprintModal(false);
        setShowCustomerBrowseModal(false);
        setShowPdtImportModal(false);
        setShowRecallModal(false);
        setShowCancelModal(false);
        setShowReturnModal(false);
        setShowSettlementModal(false);
        setShowReceiptModal(false);
        setShowLoyaltyModal(false);
        setShowCashMovementsModal(false);
        setShowShiftCloseModal(false);
        return;
      }

      if (e.altKey && e.key === "1") {
        e.preventDefault();
        handleNewBill();
      } else if (e.altKey && e.key === "2") {
        e.preventDefault();
        setShowCancelModal(true);
      } else if (e.altKey && e.key === "3") {
        e.preventDefault();
        setActiveActivity("RETURN");
        setShowReturnModal(true);
      } else if (e.altKey && e.key === "5") {
        e.preventDefault();
        setActiveActivity("RETURN_BLIND");
        setShowReturnModal(true);
      } else if (e.altKey && e.key === "6") {
        e.preventDefault();
        setShowReprintModal(true);
      } else if (e.altKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        setShowCashMovementsModal(true);
      } else if (e.altKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        setShowShiftCloseModal(true);
      } else if (e.altKey && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        setShowHotkeysModal(prev => !prev);
      } else if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        handleHoldBill();
      } else if (e.altKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        setShowRecallModal(true);
      } else if (e.altKey && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        setShowPdtImportModal(true);
      } else if (e.key === "F2") {
        e.preventDefault();
        setShowCustomerBrowseModal(true);
      } else if (e.key === "F7") {
        e.preventDefault();
        if (cartItems.length > 0) {
          handleSettlementSuccess({
            cash: netPayableAmount,
            card: 0,
            upi: 0,
            giftVoucher: 0,
            loyaltyPointsRedeemed: 0,
            loyaltyAmount: 0,
            creditNote: 0
          }, 0);
        } else {
          onNotification?.("Empty Bill", "Please add items to bill before exact cash settlement [F7].", "error");
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cartItems.length > 0) {
          setShowSettlementModal(true);
        } else {
          onNotification?.("Empty Bill", "Please add items to bill before opening settlement [F8].", "error");
        }
      } else if (e.key === "F9") {
        e.preventDefault();
        setShowTotalsPanel(prev => !prev);
        onNotification?.("Totals Toggled", "Bill totals panel toggled [F9].", "info");
      } else if (e.key === "F10") {
        e.preventDefault();
        if (cartItems.length > 0) {
          setShowSettlementModal(true);
        } else {
          onNotification?.("Empty Bill", "Please add items to bill before print & pay [F10].", "error");
        }
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [cartItems, netPayableAmount, customer, salesStaff, billDocPrefix, billDocNumber]);


  // --- Presentation-only helpers (no effect on billing logic) ---
  const fieldLabel = "block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1";
  const fieldInput =
    "h-9 w-full rounded-[18px] border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-[#171717] dark:focus:border-neutral-300 transition";
  const fieldReadonly =
    "h-9 w-full rounded-[18px] border border-transparent bg-neutral-100 dark:bg-neutral-800 px-3 text-sm text-neutral-700 dark:text-neutral-300 outline-none tabular-nums";
  const quietBtn =
    "h-8 px-3 rounded-[18px] text-[13px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition disabled:opacity-40 disabled:hover:bg-transparent";
  const menuItem =
    "w-full flex items-center justify-between gap-6 px-3 py-2 text-[13px] text-left text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg";
  const kbdHint = "text-[11px] text-neutral-400";
  const money = (n: number) => `₹${n.toFixed(2)}`;
  const anyTaxInclusive = cartItems.some(it => it.isTaxInclusive ?? !isB2B);
  const taxableValue = Math.max(0, exactBillAmount - totalTaxAmount);
  const lineSqft = (item: ProPosCartItem): number | null => {
    if (item.sqftRequested && item.sqftRequested > 0) return item.sqftRequested;
    const perBox = catalog[item.sku]?.sqftPerBox;
    return perBox && perBox > 0 ? item.qty * perBox : null;
  };
  const closeMenu = () => setShowMoreMenu(false);

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-[#141414] text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans">

      {/* ===================== 1. Bill header: number, date, quick actions ===================== */}
      <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight">
            {activeActivity === "BILLING" ? "Counter bill" : "Sales return"}
          </h2>
          <div className="flex items-center gap-1.5 text-[13px] text-neutral-500 dark:text-neutral-400">
            <span>Bill No.</span>
            <input
              type="text"
              aria-label="Bill prefix"
              value={billDocPrefix}
              onChange={e => setBillDocPrefix(e.target.value)}
              className="w-12 h-7 rounded-[14px] border border-transparent hover:border-neutral-300 focus:border-[#171717] bg-transparent text-center text-[13px] font-medium text-neutral-800 dark:text-neutral-200 outline-none"
              title="Bill number prefix"
            />
            <span className="font-medium text-neutral-800 dark:text-neutral-200 tabular-nums">{billDocNumber}</span>
            <span className="mx-1 text-neutral-300">·</span>
            <span className="tabular-nums">{currentDateTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={handleNewBill} className={quietBtn} title="Start a new bill [Alt+1]">
            <FilePlus size={14} />
            <span>New bill</span>
          </button>
          <button type="button" onClick={handleHoldBill} disabled={cartItems.length === 0} className={quietBtn} title="Hold this bill [Alt+S]">
            <Pause size={14} />
            <span>Hold</span>
          </button>
          <button type="button" onClick={() => setShowRecallModal(true)} className={quietBtn} title="Recall a held bill [Alt+R]">
            <History size={14} />
            <span>Recall{suspendedBills.length > 0 ? ` (${suspendedBills.length})` : ""}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(v => !v)}
              className={`${quietBtn} ${showMoreMenu ? "bg-neutral-100 dark:bg-neutral-800" : ""}`}
              aria-haspopup="menu"
              aria-expanded={showMoreMenu}
            >
              <span>More</span>
              <ChevronDown size={14} />
            </button>
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={closeMenu} />
                <div role="menu" className="absolute right-0 top-9 z-40 w-72 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg">
                  <button type="button" role="menuitem" className={menuItem} onClick={() => { closeMenu(); setActiveActivity("RETURN"); setShowReturnModal(true); }}>
                    <span>Sales return (with bill)</span><span className={kbdHint}>Alt+3</span>
                  </button>
                  <button type="button" role="menuitem" className={menuItem} onClick={() => { closeMenu(); setActiveActivity("RETURN_BLIND"); setShowReturnModal(true); }}>
                    <span>Sales return (no bill)</span><span className={kbdHint}>Alt+5</span>
                  </button>
                  <button type="button" role="menuitem" className={menuItem} onClick={() => { closeMenu(); setShowReprintModal(true); }}>
                    <span>Reprint a bill</span><span className={kbdHint}>Alt+6</span>
                  </button>
                  <button type="button" role="menuitem" className={menuItem} onClick={() => { closeMenu(); setShowPdtImportModal(true); }}>
                    <span>Import items from file</span><span className={kbdHint}>Alt+I</span>
                  </button>
                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                  <button type="button" role="menuitem" className={menuItem} onClick={() => { closeMenu(); setShowCashMovementsModal(true); }}>
                    <span>Cash in / out of drawer</span><span className={kbdHint}>Alt+D</span>
                  </button>
                  <button type="button" role="menuitem" className={menuItem} onClick={() => { closeMenu(); setShowShiftCloseModal(true); }}>
                    <span>Close shift</span><span className={kbdHint}>Alt+Z</span>
                  </button>
                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                  <button type="button" role="menuitem" className={menuItem} onClick={() => { closeMenu(); setShowTotalsPanel(!showTotalsPanel); }}>
                    <span>{showTotalsPanel ? "Hide" : "Show"} tax breakup</span><span className={kbdHint}>F9</span>
                  </button>
                  <button type="button" role="menuitem" className={menuItem} onClick={() => { closeMenu(); setShowHotkeysModal(true); }}>
                    <span>Keyboard shortcuts</span><span className={kbdHint}>Alt+H</span>
                  </button>
                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                  <button type="button" role="menuitem" className={`${menuItem} !text-red-700 dark:!text-red-400`} onClick={() => { closeMenu(); setShowCancelModal(true); }}>
                    <span>Cancel a bill</span><span className={kbdHint}>Alt+2</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===================== 2. Customer & bill details ===================== */}
      <section className="mx-5 mb-3 px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shrink-0 flex flex-wrap items-end gap-3">

        {/* Customer code & name (F2 browse) */}
        <div className="flex-1 min-w-[300px]">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Customer</label>
            <button
              type="button"
              onClick={() => setShowCustomerBrowseModal(true)}
              className="text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-[#171717] hover:underline"
            >
              <span>[F2] Browse</span>
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              name="posCustomerCode"
              aria-label="Customer Code"
              data-f2-browse="customer"
              value={customer.code}
              onChange={e => setCustomer(prev => ({ ...prev, code: e.target.value }))}
              onKeyDown={e => {
                if (e.key === "F2") {
                  e.preventDefault();
                  setShowCustomerBrowseModal(true);
                }
              }}
              placeholder="Code..."
              className={`${fieldInput} !w-24`}
            />
            <input
              type="text"
              name="posCustomerName"
              aria-label="Customer Name"
              data-f2-browse="customer"
              value={customer.name}
              onChange={e => setCustomer(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={e => {
                if (e.key === "F2") {
                  e.preventDefault();
                  setShowCustomerBrowseModal(true);
                }
              }}
              placeholder="Customer Name..."
              className={`${fieldInput} flex-1 font-medium`}
            />
          </div>
        </div>

        {/* GST type (read-only, follows the customer) */}
        <div className="shrink-0">
          <span className={fieldLabel}>GST type</span>
          <div className="h-9 px-3 rounded-[18px] bg-neutral-100 dark:bg-neutral-800 flex items-center gap-2 text-[13px] text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{isB2B ? "B2B" : "B2C"}</span>
            <span className="text-neutral-400">·</span>
            <span>{isInterstate ? `IGST (${posStateCode})` : `CGST+SGST (${posStateCode})`}</span>
          </div>
        </div>

        {/* Bill type */}
        <div className="w-28">
          <label className={fieldLabel}>Bill type</label>
          <select value={billType} onChange={e => setBillType(e.target.value as any)} className={fieldInput}>
            <option value="Product">Product</option>
            <option value="Service">Service</option>
          </select>
        </div>

        {/* Cash / credit */}
        <div className="w-28">
          <label className={fieldLabel}>Sale type</label>
          <select value={transactionType} onChange={e => setTransactionType(e.target.value as any)} className={fieldInput}>
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
          </select>
        </div>

        {/* Dispatch location */}
        <div className="w-44">
          <label className={fieldLabel}>Dispatch From</label>
          <select
            aria-label="Dispatch From"
            value={dispatchFrom}
            onChange={e => setDispatchFrom(e.target.value)}
            className={fieldInput}
          >
            <option value="">Default location</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Salesperson */}
        <div className="w-36">
          <label className={fieldLabel}>Salesperson</label>
          <select
            value={salesStaff}
            onChange={e => {
              setSalesStaff(e.target.value);
              setDirectStaff(e.target.value);
            }}
            className={fieldInput}
          >
            <option value="">Select staff...</option>
            {salesPeople.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ===================== 3. Item entry + bill lines | Totals & pay ===================== */}
      <main className="flex-1 min-h-0 flex gap-3 px-5 pb-3">

        {/* Left: add item + bill lines */}
        <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">

          {/* Add item row */}
          <div className="px-4 pt-3 pb-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
            <div className="flex flex-wrap items-end gap-2">

              {/* Barcode with live typeahead */}
              <div className="relative w-32">
                <label className={fieldLabel}>Barcode</label>
                <input
                  ref={directBarcodeRef}
                  type="text"
                  value={directBarcode}
                  onChange={e => {
                    setDirectBarcode(e.target.value);
                    handleItemLiveSearch(e.target.value, "barcode");
                  }}
                  onKeyDown={e => handleItemInputKeyDown(e, "barcode")}
                  placeholder="Scan..."
                  className={fieldInput}
                />
                {activeSearchField === "barcode" && (
                  <TileFlowItemTypeaheadDropdown
                    isOpen={isProductSearchOpen}
                    items={productSuggestions}
                    selectedIndex={selectedSuggestionIdx}
                    onSelect={handleSelectProductSuggestion}
                    onClose={() => setIsProductSearchOpen(false)}
                    isLoading={isProductSearching}
                    searchFieldType="barcode"
                    anchorRef={directBarcodeRef}
                  />
                )}
              </div>

              {/* Item code (Stock No / SKU) with live typeahead */}
              <div className="relative w-40">
                <label className={fieldLabel}>Item code</label>
                <input
                  ref={directStockNoRef}
                  type="text"
                  value={directStockNo}
                  onChange={e => {
                    setDirectStockNo(e.target.value);
                    handleItemLiveSearch(e.target.value, "stockNo");
                  }}
                  onKeyDown={e => handleItemInputKeyDown(e, "stockNo")}
                  placeholder="Stock No / SKU..."
                  className={`${fieldInput} font-medium`}
                />
                {activeSearchField === "stockNo" && (
                  <TileFlowItemTypeaheadDropdown
                    isOpen={isProductSearchOpen}
                    items={productSuggestions}
                    selectedIndex={selectedSuggestionIdx}
                    onSelect={handleSelectProductSuggestion}
                    onClose={() => setIsProductSearchOpen(false)}
                    isLoading={isProductSearching}
                    searchFieldType="stockNo"
                    anchorRef={directStockNoRef}
                  />
                )}
              </div>

              {/* Item name */}
              <div className="flex-1 min-w-[140px]">
                <label className={fieldLabel}>Item name</label>
                <input
                  type="text"
                  value={directDescription}
                  onChange={e => setDirectDescription(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAcceptDirectEntryItem()}
                  placeholder="Item Description..."
                  className={fieldInput}
                />
              </div>

              {/* Qty (boxes) */}
              <div className="w-[72px]">
                <label className={fieldLabel}>Qty (boxes)</label>
                <input
                  type="text"
                  value={directQty}
                  onChange={e => handleRateOrQtyChange(directRate, e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAcceptDirectEntryItem()}
                  className={`${fieldInput} text-right tabular-nums`}
                />
              </div>

              {/* Sq.Ft. converts to whole boxes */}
              <div className="w-20">
                <label className={fieldLabel}>Sq.Ft</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={directSqft}
                  onChange={e => {
                    const value = e.target.value;
                    setDirectSqft(value);
                    const known = catalog[directStockNo.trim()];
                    const sqft = parseFloat(value);
                    if (known?.sqftPerBox > 0 && sqft > 0) {
                      handleRateOrQtyChange(
                        directRate || known.price.toFixed(2),
                        String(Math.ceil(sqft / known.sqftPerBox))
                      );
                    }
                  }}
                  onKeyDown={e => e.key === "Enter" && handleAcceptDirectEntryItem()}
                  placeholder="Sq.Ft"
                  className={`${fieldInput} text-right tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
                />
              </div>

              {/* Rate */}
              <div className="w-24">
                <label className={fieldLabel}>Rate</label>
                <input
                  type="text"
                  value={directRate}
                  onChange={e => handleRateOrQtyChange(e.target.value, directQty)}
                  onKeyDown={e => e.key === "Enter" && handleAcceptDirectEntryItem()}
                  className={`${fieldInput} text-right tabular-nums`}
                />
              </div>

              {/* Disc % */}
              <div className="w-[68px]">
                <label className={fieldLabel}>Disc %</label>
                <input
                  type="text"
                  value={directDiscPct}
                  onChange={e => handleDiscPctChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAcceptDirectEntryItem()}
                  placeholder="%"
                  className={`${fieldInput} text-right tabular-nums`}
                />
              </div>

              {/* Rarely used discount fields (More columns) */}
              {showMoreColumns && (
                <>
                  <div className="w-24">
                    <label className={fieldLabel}>Disc code</label>
                    <select
                      value={directDiscCode}
                      onChange={e => setDirectDiscCode(e.target.value)}
                      className={fieldInput}
                    >
                      <option value="ILD">ILD</option>
                      <option value="B2G1">B2G1</option>
                      <option value="SCHEME">SCHEME</option>
                      <option value="NONE">NONE</option>
                    </select>
                  </div>
                  <div className="w-20">
                    <label className={fieldLabel}>Disc qty</label>
                    <input
                      type="text"
                      value={directDiscQty}
                      onChange={e => handleDiscQtyChange(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAcceptDirectEntryItem()}
                      placeholder="Disc Qty"
                      className={`${fieldInput} text-right tabular-nums`}
                      title="Quantity eligible for discount"
                    />
                  </div>
                  <div className="w-24">
                    <label className={fieldLabel}>Disc amt</label>
                    <input
                      type="text"
                      value={directDiscAmtInput}
                      onChange={e => handleDiscAmtChange(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAcceptDirectEntryItem()}
                      placeholder="₹ Amt"
                      className={`${fieldInput} text-right tabular-nums`}
                    />
                  </div>
                  <div className="w-24">
                    <span className={fieldLabel}>Value</span>
                    <input type="text" readOnly tabIndex={-1} value={directValue.toFixed(2)} className={`${fieldReadonly} text-right`} />
                  </div>
                </>
              )}

              {/* Line amount (read-only) */}
              <div className="w-24">
                <span className={fieldLabel}>Amount</span>
                <input type="text" readOnly tabIndex={-1} value={directTotal.toFixed(2)} className={`${fieldReadonly} text-right font-medium`} />
              </div>

              {/* Accept item */}
              <button
                type="button"
                onClick={handleAcceptDirectEntryItem}
                className="h-9 px-4 rounded-[18px] bg-[#171717] hover:bg-neutral-700 text-white text-sm font-medium flex items-center gap-1.5 transition active:scale-95"
                title="Add this item to the bill [Enter]"
              >
                <CornerDownLeft size={14} />
                <span>Accept</span>
              </button>
            </div>

            {/* Selected item details */}
            {selectedProductMeta && (
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-x-3 gap-y-0.5 flex-wrap min-w-0">
                  <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                    <Barcode size={12} /> {selectedProductMeta.barcode}
                  </span>
                  <span>In stock: <span className="text-neutral-800 dark:text-neutral-200 font-medium">{selectedProductMeta.stockQty} {selectedProductMeta.uom}</span></span>
                  <span>MRP {money(selectedProductMeta.mrp)}</span>
                  <span>Cost {money(selectedProductMeta.costPrice)}</span>
                  <span>{selectedProductMeta.size} / {selectedProductMeta.color}</span>
                  <span>{selectedProductMeta.brand}</span>
                  <span>HSN {selectedProductMeta.hsnCode} ({selectedProductMeta.gstPercentage}%)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductMeta(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  title="Hide item details"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Bill lines */}
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                <tr className="h-9 border-b border-neutral-200 dark:border-neutral-800">
                  <th className="pl-4 pr-2 font-medium w-10">#</th>
                  <th className="px-2 font-medium">Item code</th>
                  <th className="px-2 font-medium w-full">Item name</th>
                  <th className="px-2 font-medium text-right">Qty (boxes)</th>
                  <th className="px-2 font-medium text-right">Sq.Ft</th>
                  <th className="px-2 font-medium text-right">Rate</th>
                  {showMoreColumns && (
                    <>
                      <th className="px-2 font-medium text-right">Value</th>
                      <th className="px-2 font-medium text-center">Disc code</th>
                      <th className="px-2 font-medium text-right">Disc qty</th>
                    </>
                  )}
                  <th className="px-2 font-medium text-right">Disc %</th>
                  {showMoreColumns && <th className="px-2 font-medium text-right">Disc amt</th>}
                  <th className="px-2 font-medium text-right">GST %</th>
                  <th className="px-2 font-medium text-right">Amount</th>
                  {showMoreColumns && <th className="px-2 font-medium">Salesperson</th>}
                  <th className="pl-1 pr-3 text-right">
                    <button
                      type="button"
                      onClick={() => setShowMoreColumns(v => !v)}
                      className="text-xs font-medium text-neutral-500 hover:text-[#171717] dark:hover:text-white"
                      title="Show or hide discount code, discount qty, discount amount and salesperson columns"
                    >
                      {showMoreColumns ? "Fewer columns" : "More columns"}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {cartItems.map((item, idx) => {
                  const isSelected = selectedRowIndex === idx;
                  const sqft = lineSqft(item);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRowIndex(idx)}
                      className={`h-10 border-b border-neutral-100 dark:border-neutral-800 cursor-pointer transition ${
                        isSelected
                          ? "bg-neutral-100 dark:bg-neutral-800"
                          : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <td className="pl-4 pr-2 text-neutral-400">{idx + 1}</td>
                      <td className="px-2 font-medium">{item.sku}</td>
                      <td className="px-2 truncate max-w-[260px]" title={item.name}>{item.name}</td>
                      <td className="px-2 text-right font-medium">{item.qty.toFixed(2)}</td>
                      <td className="px-2 text-right text-neutral-600 dark:text-neutral-400">{sqft !== null ? sqft.toFixed(2) : "—"}</td>
                      <td className="px-2 text-right">{item.unitPrice.toFixed(2)}</td>
                      {showMoreColumns && (
                        <>
                          <td className="px-2 text-right">{(item.unitPrice * item.qty).toFixed(2)}</td>
                          <td className="px-2 text-center text-xs">{item.discCode || "—"}</td>
                          <td className="px-2 text-right">{(item.discQty !== undefined ? item.discQty : item.qty).toFixed(2)}</td>
                        </>
                      )}
                      <td className="px-2 text-right">{item.discountPct > 0 ? item.discountPct.toFixed(2) : "—"}</td>
                      {showMoreColumns && <td className="px-2 text-right">{item.discountAmt.toFixed(2)}</td>}
                      <td className="px-2 text-right text-neutral-600 dark:text-neutral-400">{(item.taxPct ?? 18)}%</td>
                      <td className="px-2 text-right font-semibold">{item.lineTotal.toFixed(2)}</td>
                      {showMoreColumns && <td className="px-2 text-neutral-600 dark:text-neutral-400">{item.salesStaff}</td>}
                      <td className="pl-1 pr-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                          className="p-1.5 rounded-full text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="Remove line"
                          aria-label={`Remove ${item.sku}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {cartItems.length === 0 && (
              <div className="h-[calc(100%-36px)] min-h-[120px] flex flex-col items-center justify-center gap-1 text-neutral-400">
                <Barcode size={22} strokeWidth={1.5} />
                <p className="text-sm">Scan a barcode or type an item code to start the bill</p>
              </div>
            )}
          </div>

          {/* Shortcut hint */}
          <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 shrink-0 truncate">
            Shortcuts: F2 customer · F7 exact cash · F8 settle · F9 tax breakup · F10 print &amp; pay · Alt+1 new bill · Alt+S hold · Alt+R recall · Alt+H all shortcuts
          </div>
        </div>

        {/* Right: totals & payment */}
        <aside className="w-80 shrink-0 flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <div className="px-4 pt-3 pb-2 flex items-baseline justify-between border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-sm font-semibold">Bill summary</span>
            <span className="text-xs text-neutral-500 tabular-nums">
              {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"} · {totalQuantity.toFixed(2)} boxes
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-auto px-4 py-3 space-y-2 text-[13px] tabular-nums">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Sub-total</span>
              <span>{money(grossSalesValue)}</span>
            </div>
            {itemDiscountsTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Discount</span>
                <span className="text-red-600 dark:text-red-400">-{money(itemDiscountsTotal)}</span>
              </div>
            )}
            {showTotalsPanel && (
              <>
                <div className="flex justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Taxable value</span>
                  <span>{money(taxableValue)}</span>
                </div>
                {isInterstate ? (
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">IGST</span>
                    <span>{money(totalTaxAmount)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">CGST</span>
                      <span>{money(totalTaxAmount / 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">SGST</span>
                      <span>{money(totalTaxAmount / 2)}</span>
                    </div>
                  </>
                )}
                {anyTaxInclusive && cartItems.length > 0 && (
                  <p className="text-[11px] text-neutral-400">Rates include GST</p>
                )}
              </>
            )}
          </div>

          <div className="px-4 pt-3 pb-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
            {roundOffAmount !== 0 && (
              <div className="flex justify-between text-[13px] tabular-nums">
                <span className="text-neutral-500 dark:text-neutral-400">Round-off</span>
                <span>{roundOffAmount > 0 ? "+" : "-"}{money(Math.abs(roundOffAmount))}</span>
              </div>
            )}
            <div className="flex items-end justify-between">
              <span className="text-[15px] font-semibold text-neutral-700 dark:text-neutral-200">Net Amount</span>
              <span className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">{money(netPayableAmount)}</span>
            </div>

            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={() => setShowSettlementModal(true)}
              className="w-full h-12 rounded-[18px] bg-[#171717] hover:bg-neutral-700 text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
            >
              <Printer size={16} />
              <span>Print &amp; Pay</span>
              <span className="text-xs font-normal opacity-60">F10</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => {
                  handleSettlementSuccess({
                    cash: netPayableAmount,
                    card: 0,
                    upi: 0,
                    giftVoucher: 0,
                    loyaltyPointsRedeemed: 0,
                    loyaltyAmount: 0,
                    creditNote: 0
                  }, 0);
                }}
                className="h-10 rounded-[18px] border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[13px] font-medium flex items-center justify-center gap-1.5 transition active:scale-[0.98] disabled:opacity-40"
              >
                <span>Exact Cash</span>
                <span className="text-[11px] text-neutral-400">F7</span>
              </button>

              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={() => setShowSettlementModal(true)}
                className="h-10 rounded-[18px] border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[13px] font-medium flex items-center justify-center gap-1.5 transition active:scale-[0.98] disabled:opacity-40"
              >
                <span>Settlement</span>
                <span className="text-[11px] text-neutral-400">F8</span>
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* ========================================================================= */}
      {/* 4. MODALS & POPUPS (Customer Browse, PDT Import, Recall, Void, Settle)    */}
      {/* ========================================================================= */}
      {showHotkeysModal && (
        <TileFlowProPosHotkeysDlg
          onClose={() => setShowHotkeysModal(false)}
        />
      )}

      {showReprintModal && (
        <TileFlowProPosReprintDlg
          onReprintBill={(docType, docNo) => {
            onNotification?.("Document Reprinted", `${docType} #${docNo} sent to thermal printer.`, "success");
          }}
          onClose={() => setShowReprintModal(false)}
        />
      )}

      {showCustomerBrowseModal && (
        <TileFlowCustomerBrowseModal
          onSelectCustomer={(c) => {
            setCustomer(c);
            onNotification?.("Customer Selected", `${c.name} (${c.code}) loaded.`, "success");
          }}
          onClose={() => setShowCustomerBrowseModal(false)}
        />
      )}

      {showPdtImportModal && (
        <TileFlowPdtImportDlg
          onImportItems={handlePdtImportSuccess}
          onClose={() => setShowPdtImportModal(false)}
        />
      )}

      {showSettlementModal && (
        <TileFlowPosSettlement
          netAmount={netPayableAmount}
          customer={customer}
          onSettle={handleSettlementSuccess}
          onClose={() => setShowSettlementModal(false)}
        />
      )}

      {showRecallModal && (
        <TileFlowProPosRecallDlg
          suspendedBills={suspendedBills}
          onRecallBill={handleRecallBill}
          onDeleteSuspendedBill={(id) => setSuspendedBills(prev => prev.filter(b => b.id !== id))}
          onClose={() => setShowRecallModal(false)}
        />
      )}

      {showCancelModal && (
        <TileFlowProPosCancelDlg
          onCancelBill={(rec) => {
            onNotification?.("Invoice Cancelled", `Bill ${rec.billNo} voided successfully.`, "info");
          }}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      {showLoyaltyModal && (
        <TileFlowLoyaltyLookupDlgpModal
          currentCustomer={customer}
          onSelectCustomer={(c) => setCustomer(c)}
          onApplyLoyaltyPoints={(pts, amt) => {
            onNotification?.("Loyalty Redeemed", `${pts} points (₹${amt}) applied to transaction.`, "success");
          }}
          onClose={() => setShowLoyaltyModal(false)}
        />
      )}

      {showReturnModal && (
        <TileFlowProPosSalesReturnModal
          onProcessReturn={(ret) => {
            onNotification?.("Return Processed", `Credit Note for ₹${ret.totalRefund.toFixed(2)} generated.`, "success");
          }}
          onClose={() => setShowReturnModal(false)}
        />
      )}

      {showReceiptModal && lastCompletedBill && (
        <TileFlowProPosTaxInvoiceReceipt
          billNo={lastCompletedBill.billNo}
          billDate={lastCompletedBill.billDate}
          customer={lastCompletedBill.customer}
          salesStaff={lastCompletedBill.salesStaff}
          items={lastCompletedBill.items}
          subTotal={lastCompletedBill.subTotal}
          discountTotal={lastCompletedBill.discountTotal}
          taxTotal={lastCompletedBill.taxTotal}
          netPayable={lastCompletedBill.netPayable}
          tenders={lastCompletedBill.tenders}
          changeDue={lastCompletedBill.changeDue}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {showCashMovementsModal && (
        <TileFlowProPosCashMovementsModal
          shiftId={activeShiftId}
          onSuccess={(mov) => {
            onNotification?.(
              "Movement Recorded",
              `${mov.type === "CASH_DROP" ? "Cash Drop" : "Till Expense"} of ₹${mov.amount.toFixed(2)} posted.`,
              "success"
            );
          }}
          onClose={() => setShowCashMovementsModal(false)}
          onNotification={onNotification}
        />
      )}

      {showShiftCloseModal && (
        <TileFlowProPosShiftCloseModal
          shiftId={activeShiftId}
          onShiftClosed={(zRep) => {
            onNotification?.(
              "Register Closed",
              `Shift ${zRep.shift_code || activeShiftId} successfully closed and reconciled.`,
              "success"
            );
          }}
          onClose={() => setShowShiftCloseModal(false)}
          onNotification={onNotification}
        />
      )}

    </div>
  );
};

export default TileFlowProPosBillinginal;

