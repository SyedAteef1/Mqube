import React, { useState } from "react";
import { ShiftCashMovementRecord, ShiftCashDropPayload, ShiftTillExpensePayload } from "./types.ts";
import { apiFetchV1 } from "../../../lib/apiFetchV1.ts";
import {
  Vault,
  Receipt,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
  Building2,
  Coffee,
  Truck,
  FileSpreadsheet,
  Wrench
} from "lucide-react";

interface TileFlowProPosCashMovementsModalProps {
  shiftId: string;
  onSuccess: (movement: ShiftCashMovementRecord) => void;
  onClose: () => void;
  onNotification?: (title: string, message: string, type: "success" | "error" | "info") => void;
}

type MovementMode = "CASH_IN" | "CASH_DROP" | "TILL_EXPENSE";

const EXPENSE_CATEGORIES = [
  { id: "TEA_REFRESHMENT", label: "Tea & Refreshments", icon: Coffee },
  { id: "COURIER_SHIPPING", label: "Courier & Delivery", icon: Truck },
  { id: "STATIONERY", label: "Store Stationery / Thermal Rolls", icon: FileSpreadsheet },
  { id: "MAINTENANCE", label: "Emergency Repair / Maintenance", icon: Wrench },
  { id: "MISCELLANEOUS", label: "Miscellaneous Petty Expense", icon: Receipt },
];

export const TileFlowProPosCashMovementsModal: React.FC<TileFlowProPosCashMovementsModalProps> = ({
  shiftId,
  onSuccess,
  onClose,
  onNotification,
}) => {
  const [mode, setMode] = useState<MovementMode>("CASH_DROP");
  const [amountInput, setAmountInput] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TEA_REFRESHMENT");
  const [safeId, setSafeId] = useState<string>("SAFE-MAIN-01");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastPostedVoucher, setLastPostedVoucher] = useState<{ id: string; type: string } | null>(null);

  const amount = parseFloat(amountInput) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      onNotification?.("Invalid Amount", "Please enter a valid cash amount greater than zero.", "error");
      return;
    }
    if (!reason.trim()) {
      onNotification?.("Reason Required", "Please enter a reason or description for this drawer transaction.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "CASH_IN") {
        const payload = {
          amount,
          reason: reason.trim(),
          receipt_ref: reference.trim() || undefined,
        };

        const res = await apiFetchV1<any>(`/pos/shifts/${shiftId}/cash-in`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const movement: ShiftCashMovementRecord = {
          id: res.id || `in-${Date.now()}`,
          shiftId,
          type: "CASH_IN",
          amount: res.amount || amount,
          reason: res.reason || reason,
          reference: res.receipt_ref || reference,
          journalVoucherId: res.gl_voucher_id || res.journal_voucher_id,
          createdAt: res.created_at || new Date().toISOString(),
        };

        setLastPostedVoucher({
          id: res.gl_voucher_no || res.gl_voucher_id || "JV-AUTO-POSTED",
          type: "CASH_IN (Debit Drawer Cash 1010, Credit Safe/Bank 1020)",
        });

        onNotification?.(
          "Cash In Posted",
          `₹${amount.toFixed(2)} added to drawer float. GL Voucher ${res.gl_voucher_no || ""} recorded.`,
          "success"
        );

        onSuccess(movement);
      } else if (mode === "CASH_DROP") {
        const payload: ShiftCashDropPayload = {
          amount,
          reason: reason.trim(),
          reference: reference.trim() || undefined,
          safe_id: safeId,
        };

        const res = await apiFetchV1<any>(`/pos/shifts/${shiftId}/cash-drop`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const movement: ShiftCashMovementRecord = {
          id: res.id || `drop-${Date.now()}`,
          shiftId,
          type: "CASH_DROP",
          amount: res.amount || amount,
          reason: res.reason || reason,
          reference: res.reference || reference,
          journalVoucherId: res.gl_voucher_id || res.journal_voucher_id,
          createdAt: res.created_at || new Date().toISOString(),
        };

        setLastPostedVoucher({
          id: res.gl_voucher_no || res.gl_voucher_id || "JV-AUTO-POSTED",
          type: "CASH_DROP (Debit Safe 1020, Credit Drawer Cash 1010)",
        });

        onNotification?.(
          "Cash Drop Posted",
          `₹${amount.toFixed(2)} transferred to safe. GL Voucher ${res.gl_voucher_no || ""} recorded.`,
          "success"
        );

        onSuccess(movement);
      } else {
        const catLabel = EXPENSE_CATEGORIES.find((c) => c.id === selectedCategory)?.label || "Petty Expense";
        const fullReason = `[${catLabel}] ${reason.trim()}`;
        const payload: ShiftTillExpensePayload = {
          amount,
          reason: fullReason,
          category: selectedCategory,
          reference: reference.trim() || undefined,
        };

        const res = await apiFetchV1<any>(`/pos/shifts/${shiftId}/till-expense`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const movement: ShiftCashMovementRecord = {
          id: res.id || `exp-${Date.now()}`,
          shiftId,
          type: "TILL_EXPENSE",
          amount: res.amount || amount,
          reason: res.reason || fullReason,
          reference: res.receipt_ref || reference,
          journalVoucherId: res.gl_voucher_id || res.journal_voucher_id,
          createdAt: res.created_at || new Date().toISOString(),
        };

        setLastPostedVoucher({
          id: res.gl_voucher_no || res.gl_voucher_id || "JV-AUTO-POSTED",
          type: "TILL_EXPENSE (Debit Expenses 5000, Credit Drawer Cash 1010)",
        });

        onNotification?.(
          "Till Expense Recorded",
          `₹${amount.toFixed(2)} petty expense disbursed. GL Voucher ${res.gl_voucher_no || ""} recorded.`,
          "success"
        );

        onSuccess(movement);
      }
    } catch (err: any) {
      console.error("Failed to record cash movement:", err);
      onNotification?.("Transaction Error", err?.message || "Failed to post cash movement to backend.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#222222] border border-[#c6c6c6] dark:border-[#474747] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#e7e7e7] dark:border-[#3f3f3f] bg-[#fafafa] dark:bg-[#1b1b1b]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#272727] text-white shadow-xs">
              <Vault size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#272727] dark:text-[#bababa]">
                Cash Drawer Movement
              </h3>
              <p className="text-[11px] text-[#727272] dark:text-[#a1a1a1]">
                Shift: <span className="font-mono font-semibold">{shiftId}</span> • Automated Dual-Entry GL Integration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#727272] hover:text-[#171717] dark:text-[#a1a1a1] dark:hover:text-white rounded-xl hover:bg-[#e7e7e7] dark:hover:bg-[#3f3f3f] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 p-2 bg-[#f4f4f4] dark:bg-[#171717] gap-1.5 border-b border-[#e7e7e7] dark:border-[#3f3f3f]">
          <button
            type="button"
            onClick={() => {
              setMode("CASH_IN");
              setLastPostedVoucher(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === "CASH_IN"
                ? "bg-[#272727] text-white shadow-xs"
                : "text-[#727272] dark:text-[#a1a1a1] hover:bg-white dark:hover:bg-[#282828]"
            }`}
          >
            <ArrowUpCircle size={14} />
            <span>Cash In (Float)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("CASH_DROP");
              setLastPostedVoucher(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === "CASH_DROP"
                ? "bg-[#272727] text-white shadow-xs"
                : "text-[#727272] dark:text-[#a1a1a1] hover:bg-white dark:hover:bg-[#282828]"
            }`}
          >
            <ArrowDownCircle size={14} />
            <span>Cash Drop (Safe)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("TILL_EXPENSE");
              setLastPostedVoucher(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === "TILL_EXPENSE"
                ? "bg-[#272727] text-white shadow-xs"
                : "text-[#727272] dark:text-[#a1a1a1] hover:bg-white dark:hover:bg-[#282828]"
            }`}
          >
            <Receipt size={14} />
            <span>Till Expense</span>
          </button>
        </div>

        {/* Voucher Success Alert (if just posted) */}
        {lastPostedVoucher && (
          <div className="m-4 p-3.5 rounded-2xl bg-[#dcfce7] dark:bg-[#14532d]/40 border border-[#86efac] text-[#166534] dark:text-[#86efac] flex items-start gap-3">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold">Transaction Successfully Posted &amp; Balanced</div>
              <div className="font-mono text-[11px] mt-0.5">Voucher ID: {lastPostedVoucher.id}</div>
              <div className="text-[10px] opacity-80 mt-0.5">{lastPostedVoucher.type}</div>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount Field with Quick Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#535353] dark:text-[#d4d4d4] mb-1.5">
              Cash Amount to {mode === "CASH_DROP" ? "Transfer to Safe" : "Disburse"} (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-[#727272] font-mono">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1"
                autoFocus
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 text-lg font-mono font-bold rounded-xl border border-[#d4d4d4] dark:border-[#535353] bg-[#fafafa] dark:bg-[#171717] text-[#171717] dark:text-[#fafafa] focus:border-[#272727] focus:ring-2 focus:ring-[#272727]/20 outline-none transition"
              />
            </div>

            {/* Quick Amount Badges */}
            <div className="flex gap-2 mt-2">
              {[500, 1000, 2000, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountInput(preset.toString())}
                  className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#f4f4f4] dark:bg-[#3f3f3f] hover:bg-[#e7e7e7] dark:hover:bg-[#535353] text-[#3f3f3f] dark:text-[#e7e7e7] rounded-lg transition"
                >
                  +₹{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Mode-Specific Fields */}
          {mode === "CASH_DROP" ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#535353] dark:text-[#d4d4d4] mb-1.5">
                Target Safe / Vault Location
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-[#d4d4d4] dark:border-[#535353] bg-[#fafafa] dark:bg-[#171717]">
                <Building2 size={16} className="text-[#272727] dark:text-[#bababa]" />
                <select
                  value={safeId}
                  onChange={(e) => setSafeId(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#282828] dark:text-[#fafafa] outline-none"
                >
                  <option value="SAFE-MAIN-01">Main Store Fireproof Safe (Vault 01)</option>
                  <option value="SAFE-BACKOFFICE-02">Back Office Cash Drop Box (Box 02)</option>
                  <option value="BANK-DEPOSIT-BAG">Armored Courier Transit Bag (CIT)</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#535353] dark:text-[#d4d4d4] mb-1.5">
                Petty Expense Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                        isSelected
                          ? "bg-[#f4f4f4] dark:bg-[#282828] border-[#272727] text-[#272727] dark:text-[#bababa] font-bold"
                          : "border-[#e7e7e7] dark:border-[#3f3f3f] text-[#535353] dark:text-[#a1a1a1] hover:bg-[#fafafa]"
                      }`}
                    >
                      <Icon size={14} className="shrink-0" />
                      <span className="text-[11px] truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#535353] dark:text-[#d4d4d4] mb-1.5">
              Reason / Narrative Description *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                mode === "CASH_DROP"
                  ? "e.g., Midday drawer limit threshold exceeded, safe transfer"
                  : "e.g., Courier charges for urgent master parcel, customer delivery"
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#d4d4d4] dark:border-[#535353] bg-[#fafafa] dark:bg-[#171717] text-[#171717] dark:text-[#fafafa] focus:border-[#272727] focus:ring-2 focus:ring-[#272727]/20 outline-none transition"
            />
          </div>

          {/* Reference / Voucher Slip # */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#535353] dark:text-[#d4d4d4] mb-1.5">
              Supporting Bill / Slip Reference (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., SLIP-9842, BLUEDART-AWB-28941"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-[#d4d4d4] dark:border-[#535353] bg-[#fafafa] dark:bg-[#171717] text-[#171717] dark:text-[#fafafa] focus:border-[#272727] focus:ring-2 focus:ring-[#272727]/20 outline-none transition"
            />
          </div>

          {/* Accounting Impact Explainer */}
          <div className="p-3 bg-[#fafafa] dark:bg-[#171717] rounded-xl border border-[#e7e7e7] dark:border-[#3f3f3f] text-[11px] text-[#727272] dark:text-[#a1a1a1] flex items-start gap-2">
            <ShieldCheck size={16} className="text-[#272727] dark:text-[#bababa] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#282828] dark:text-[#fafafa]">Double-Entry Accounting Impact:</span>{" "}
              {mode === "CASH_DROP"
                ? "Posts Journal Voucher debiting Safe Cash (1020) and crediting Drawer Cash (1010)."
                : "Posts Journal Voucher debiting Store Petty Expenses (5000) and crediting Drawer Cash (1010)."}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end items-center gap-3 pt-3 border-t border-[#e7e7e7] dark:border-[#3f3f3f]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#727272] dark:text-[#a1a1a1] hover:bg-[#f4f4f4] dark:hover:bg-[#3f3f3f] rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0 || !reason.trim()}
              className="px-6 py-2.5 bg-[#272727] hover:bg-[#414141] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-40 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Posting GL Voucher...</span>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>
                    Confirm {mode === "CASH_DROP" ? "Safe Cash Drop" : "Till Payout"} (₹{amount.toFixed(2)})
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TileFlowProPosCashMovementsModal;
