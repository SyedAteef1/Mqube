import React from "react";
import { CashDenominations } from "./types.ts";
import { Banknote, Coins, RotateCcw, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

interface TileFlowProPosDenominationInputProps {
  denominations: CashDenominations;
  onChange: (denominations: CashDenominations, totalAmount: number) => void;
  expectedCash?: number;
  readOnly?: boolean;
  compact?: boolean;
}

interface DenominationSpec {
  key: keyof CashDenominations;
  label: string;
  multiplier: number;
  isCoin?: boolean;
  colorClass: string;
  badgeBg: string;
}

const DENOMINATIONS: DenominationSpec[] = [
  { key: "notes_2000", label: "₹2,000 Note", multiplier: 2000, colorClass: "text-[#717171]", badgeBg: "bg-[#ededed] dark:bg-[#333333]/30 border-[#c0c0c0]" },
  { key: "notes_500", label: "₹500 Note", multiplier: 500, colorClass: "text-[#ca8a04]", badgeBg: "bg-[#fef9c3] dark:bg-[#713f12]/30 border-[#fde047]" },
  { key: "notes_200", label: "₹200 Note", multiplier: 200, colorClass: "text-[#ea580c]", badgeBg: "bg-[#ffedd5] dark:bg-[#7c2d12]/30 border-[#fdba74]" },
  { key: "notes_100", label: "₹100 Note", multiplier: 100, colorClass: "text-[#555555]", badgeBg: "bg-[#ececec] dark:bg-[#303030]/30 border-[#c1c1c1]" },
  { key: "notes_50", label: "₹50 Note", multiplier: 50, colorClass: "text-[#6d6d6d]", badgeBg: "bg-[#efefef] dark:bg-[#3f3f3f]/30 border-[#c4c4c4]" },
  { key: "notes_20", label: "₹20 Note", multiplier: 20, colorClass: "text-[#16a34a]", badgeBg: "bg-[#dcfce7] dark:bg-[#14532d]/30 border-[#86efac]" },
  { key: "notes_10", label: "₹10 Note", multiplier: 10, colorClass: "text-[#b45309]", badgeBg: "bg-[#fef3c7] dark:bg-[#78350f]/30 border-[#fcd34d]" },
  { key: "notes_5", label: "₹5 Note / Coin", multiplier: 5, colorClass: "text-[#535353]", badgeBg: "bg-[#f4f4f4] dark:bg-[#282828]/50 border-[#d4d4d4]" },
  { key: "notes_2", label: "₹2 Note / Coin", multiplier: 2, colorClass: "text-[#535353]", badgeBg: "bg-[#f4f4f4] dark:bg-[#282828]/50 border-[#d4d4d4]" },
  { key: "notes_1", label: "₹1 Note / Coin", multiplier: 1, colorClass: "text-[#535353]", badgeBg: "bg-[#f4f4f4] dark:bg-[#282828]/50 border-[#d4d4d4]" },
  { key: "coins", label: "Mixed Coins Value (₹)", multiplier: 1, isCoin: true, colorClass: "text-[#767676]", badgeBg: "bg-[#ccfbf1] dark:bg-[#414141]/30 border-[#cbcbcb]" },
];

export const calculateDenominationTotal = (denoms: CashDenominations): number => {
  return (
    (denoms.notes_2000 || 0) * 2000 +
    (denoms.notes_500 || 0) * 500 +
    (denoms.notes_200 || 0) * 200 +
    (denoms.notes_100 || 0) * 100 +
    (denoms.notes_50 || 0) * 50 +
    (denoms.notes_20 || 0) * 20 +
    (denoms.notes_10 || 0) * 10 +
    (denoms.notes_5 || 0) * 5 +
    (denoms.notes_2 || 0) * 2 +
    (denoms.notes_1 || 0) * 1 +
    (denoms.coins || 0)
  );
};

export const TileFlowProPosDenominationInput: React.FC<TileFlowProPosDenominationInputProps> = ({
  denominations,
  onChange,
  expectedCash,
  readOnly = false,
  compact = false,
}) => {
  const totalCounted = calculateDenominationTotal(denominations);
  const variance = expectedCash !== undefined ? totalCounted - expectedCash : 0;

  const handleFieldChange = (key: keyof CashDenominations, rawVal: string) => {
    const parsed = parseInt(rawVal.replace(/[^\d]/g, ""), 10);
    const count = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    const updated = {
      ...denominations,
      [key]: count,
    };
    const newTotal = calculateDenominationTotal(updated);
    onChange(updated, newTotal);
  };

  const handleClearAll = () => {
    if (readOnly) return;
    const cleared: CashDenominations = {
      notes_2000: 0,
      notes_500: 0,
      notes_200: 0,
      notes_100: 0,
      notes_50: 0,
      notes_20: 0,
      notes_10: 0,
      notes_5: 0,
      notes_2: 0,
      notes_1: 0,
      coins: 0,
    };
    onChange(cleared, 0);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-[#232323] border border-[#c6c6c6] dark:border-[#474747] rounded-2xl p-4 shadow-sm space-y-4">
      {/* Header with Title & Reset Button */}
      <div className="flex justify-between items-center pb-2 border-b border-[#e7e7e7] dark:border-[#3f3f3f]">
        <div className="flex items-center gap-2">
          <Banknote className="text-[#272727] dark:text-[#bababa]" size={18} />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1b1b1b] dark:text-white">
            Physical Cash Denomination Breakdown
          </h4>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1 text-[11px] font-semibold text-[#5e5e5e] dark:text-[#c6c6c6] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition flex items-center gap-1"
          >
            <RotateCcw size={12} />
            <span>Reset Counts</span>
          </button>
        )}
      </div>

      {/* Grid of Denominations */}
      <div className={`grid ${compact ? "grid-cols-1 md:grid-cols-2 gap-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5"}`}>
        {DENOMINATIONS.map((d) => {
          const count = denominations[d.key] || 0;
          const subtotal = d.isCoin ? count : count * d.multiplier;

          return (
            <div
              key={d.key}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                count > 0
                  ? "bg-[#fafafa] dark:bg-[#232323] border-[#272727]/40 dark:border-[#bababa]/40 shadow-xs"
                  : "bg-[#fcfcfc] dark:bg-[#1c1c1c] border-[#e7e7e7] dark:border-[#3f3f3f]"
              }`}
            >
              {/* Badge & Label */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${d.badgeBg} ${d.colorClass}`}
                >
                  {d.isCoin ? <Coins size={12} className="inline mr-1" /> : null}
                  {d.multiplier >= 1 && !d.isCoin ? `₹${d.multiplier}` : "Coins"}
                </span>
                <span className="text-[11px] font-medium text-[#535353] dark:text-[#d4d4d4] truncate">
                  {d.label}
                </span>
              </div>

              {/* Count Input & Subtotal */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[#a1a1a1] font-mono">×</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={readOnly}
                  value={count === 0 ? "" : count}
                  placeholder="0"
                  onChange={(e) => handleFieldChange(d.key, e.target.value)}
                  className="w-16 px-2 py-1 text-center font-mono font-bold text-xs rounded-lg border border-[#d4d4d4] dark:border-[#535353] bg-white dark:bg-[#171717] text-[#282828] dark:text-[#fafafa] focus:border-[#272727] focus:ring-1 focus:ring-[#272727] outline-none transition disabled:opacity-50"
                />
                <span className="text-[10px] text-[#a1a1a1] font-mono">=</span>
                <span className="w-20 text-right font-mono font-bold text-xs text-[#171717] dark:text-[#fafafa]">
                  ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer Matrix */}
      <div className="pt-2 border-t border-[#e7e7e7] dark:border-[#3f3f3f] grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        {/* Counted Total */}
        <div className="bg-[#f4f4f4] dark:bg-[#282828] p-3 rounded-xl border border-[#d4d4d4] dark:border-[#3f3f3f] flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#727272] dark:text-[#a1a1a1]">
              Physical Count Total
            </span>
            <div className="text-lg font-mono font-bold text-[#272727] dark:text-[#bababa]">
              ₹{totalCounted.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <Banknote className="text-[#272727] dark:text-[#bababa] opacity-60" size={24} />
        </div>

        {/* Expected Cash in Register (if provided) */}
        {expectedCash !== undefined && (
          <div className="bg-[#f4f4f4] dark:bg-[#282828] p-3 rounded-xl border border-[#d4d4d4] dark:border-[#3f3f3f] flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#727272] dark:text-[#a1a1a1]">
                System Expected Cash
              </span>
              <div className="text-lg font-mono font-bold text-[#282828] dark:text-[#fafafa]">
                ₹{expectedCash.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <ArrowRight className="text-[#727272] opacity-60" size={20} />
          </div>
        )}

        {/* Live Variance Calculation */}
        {expectedCash !== undefined && (
          <div
            className={`p-3 rounded-xl border flex justify-between items-center ${
              Math.abs(variance) < 0.01
                ? "bg-[#dcfce7] dark:bg-[#14532d]/40 border-[#86efac] text-[#166534] dark:text-[#86efac]"
                : variance < 0
                ? "bg-[#fee2e2] dark:bg-[#7f1d1d]/40 border-[#fca5a5] text-[#991b1b] dark:text-[#fca5a5]"
                : "bg-[#fef3c7] dark:bg-[#78350f]/40 border-[#fcd34d] text-[#92400e] dark:text-[#fcd34d]"
            }`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {Math.abs(variance) < 0.01
                  ? "Reconciliation Status"
                  : variance < 0
                  ? "Cash Shortage"
                  : "Cash Overage"}
              </span>
              <div className="text-lg font-mono font-bold">
                {Math.abs(variance) < 0.01
                  ? "Balanced (₹0.00)"
                  : `${variance < 0 ? "-" : "+"}₹${Math.abs(variance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </div>
            {Math.abs(variance) < 0.01 ? (
              <CheckCircle2 size={24} className="text-[#16a34a]" />
            ) : (
              <AlertTriangle size={24} className={variance < 0 ? "text-[#dc2626]" : "text-[#d97706]"} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TileFlowProPosDenominationInput;
