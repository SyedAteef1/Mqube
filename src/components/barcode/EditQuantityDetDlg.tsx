import React, { useState, useMemo } from "react";
import { X, Edit3, Search, Check, Trash2, Layers, Sparkles } from "lucide-react";
import { LabelPrintRow } from "./types.ts";

interface EditQuantityDetailsModalProps {
  isOpen: boolean;
  rows: LabelPrintRow[];
  batchId?: string;
  onClose: () => void;
  onSave: (updatedRows: LabelPrintRow[]) => void;
}

export const EditQuantityDetailsModal: React.FC<EditQuantityDetailsModalProps> = ({
  isOpen,
  rows: initialRows,
  batchId = "BATCH-9942-A",
  onClose,
  onSave
}) => {
  const [localRows, setLocalRows] = useState<LabelPrintRow[]>(() => [...initialRows]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!isOpen) return null;

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return localRows;
    const q = searchQuery.toLowerCase();
    return localRows.filter(r =>
      r.stockNo.toLowerCase().includes(q) ||
      r.product.toLowerCase().includes(q) ||
      r.brand.toLowerCase().includes(q) ||
      r.style.toLowerCase().includes(q) ||
      r.colour.toLowerCase().includes(q) ||
      r.size.toLowerCase().includes(q)
    );
  }, [localRows, searchQuery]);

  const totalLabels = useMemo(() => {
    return localRows.reduce((sum, r) => sum + (r.labelCount || 0), 0);
  }, [localRows]);

  const handleUpdateQty = (id: string, count: number) => {
    const validCount = isNaN(count) ? 0 : Math.max(0, count);
    setLocalRows(prev => prev.map(r => (r.id === id ? { ...r, labelCount: validCount } : r)));
  };

  const handleSetAll = (val: number) => {
    setLocalRows(prev => prev.map(r => ({ ...r, labelCount: Math.max(0, val) })));
  };

  const handleSetAllToStock = () => {
    setLocalRows(prev => prev.map(r => ({ ...r, labelCount: Math.max(0, r.currentStock) })));
  };

  const handleClearAll = () => {
    setLocalRows(prev => prev.map(r => ({ ...r, labelCount: 0 })));
  };

  const handleSaveAndClose = () => {
    onSave(localRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      {/* Modal Card */}
      <div className="bg-[#f9f9f9] text-[#1b1b1b] rounded-lg border border-[#c6c6c6] w-full max-w-4xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-[#c6c6c6] flex justify-between items-center bg-[#eeeeee]">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-[#141414]" />
            <div>
              <h2 className="font-semibold text-sm text-[#141414]">Edit Quantity Details</h2>
              <p className="text-[11px] text-[#474747]">Adjust required label quantities for the current batch prior to printing.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#e8e8e8] text-[#1b1b1b] font-mono text-[11px] font-bold border border-[#c6c6c6]">
              Batch: #{batchId}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-[#474747] hover:text-[#ba1a1a] p-1 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar with Quick Fill actions */}
        <div className="px-6 py-2 bg-white border-b border-[#c6c6c6] flex flex-wrap justify-between items-center gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#474747] text-[11px]">Quick Fill:</span>
            <button
              type="button"
              onClick={() => handleSetAll(1)}
              className="px-2 py-0.5 bg-[#eeeeee] hover:bg-[#e8e8e8] border border-[#c6c6c6] rounded text-[11px] font-semibold text-[#141414]"
            >
              All = 1
            </button>
            <button
              type="button"
              onClick={handleSetAllToStock}
              className="px-2 py-0.5 bg-[#eeeeee] hover:bg-[#e8e8e8] border border-[#c6c6c6] rounded text-[11px] font-semibold text-[#141414]"
            >
              All = Stock
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2 py-0.5 bg-[#ffdad6] hover:bg-[#ffb4ab] border border-[#ffb4ab] rounded text-[11px] font-semibold text-[#93000a]"
            >
              Reset 0
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#75777e]" />
              <input
                type="text"
                placeholder="Filter items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-6 pr-2 py-1 text-xs border border-[#c6c6c6] rounded bg-[#f9f9f9] focus:bg-white outline-none focus:border-[#5c5c5c] w-48 h-6"
              />
            </div>
            <span className="font-mono text-xs font-bold text-[#141414] bg-[#e2e2e2] px-2 py-0.5 rounded border border-[#929292]">
              Total Labels: {totalLabels}
            </span>
          </div>
        </div>

        {/* Modal Body (Data Grid) */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <div className="border border-[#c6c6c6] rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#eeeeee] sticky top-0 z-10 border-b border-[#c6c6c6] text-[11px] font-bold text-[#141414]">
                <tr>
                  <th className="p-2 border-r border-[#c6c6c6] w-12 text-center text-[#474747]">#</th>
                  <th className="p-2 border-r border-[#c6c6c6]">Stock Number</th>
                  <th className="p-2 border-r border-[#c6c6c6]">Product</th>
                  <th className="p-2 border-r border-[#c6c6c6]">Brand</th>
                  <th className="p-2 border-r border-[#c6c6c6]">Style</th>
                  <th className="p-2 border-r border-[#c6c6c6]">Shade</th>
                  <th className="p-2 border-r border-[#c6c6c6] w-16">Size</th>
                  <th className="p-2 border-r border-[#c6c6c6] w-20 text-right">Stock</th>
                  <th className="p-2 font-bold text-[#141414] bg-[#e8e8e8] w-24 text-right"># Lbls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c6c6]/50 text-[#1b1b1b]">
                {filteredRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-[#f4f4f4] transition-colors ${
                      idx % 2 === 1 ? "bg-[#f9f9f9]" : "bg-white"
                    }`}
                  >
                    <td className="p-2 border-r border-[#c6c6c6] text-center text-[#474747] font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-r border-[#c6c6c6] font-mono font-bold text-[#141414]">
                      {row.stockNo}
                    </td>
                    <td className="p-2 border-r border-[#c6c6c6]">{row.product}</td>
                    <td className="p-2 border-r border-[#c6c6c6]">{row.brand}</td>
                    <td className="p-2 border-r border-[#c6c6c6]">{row.style}</td>
                    <td className="p-2 border-r border-[#c6c6c6]">{row.colour}</td>
                    <td className="p-2 border-r border-[#c6c6c6] font-mono">{row.size}</td>
                    <td className="p-2 border-r border-[#c6c6c6] text-right font-mono text-[#474747]">
                      {row.currentStock}
                    </td>
                    <td className="p-1 bg-[#e8e8e8]/40">
                      <input
                        type="number"
                        min="0"
                        value={row.labelCount}
                        onChange={e => handleUpdateQty(row.id, parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-[#75777e] rounded focus:outline-none focus:border-[#5c5c5c] focus:ring-1 focus:ring-[#5c5c5c] font-mono font-bold text-xs text-right bg-white text-[#141414]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#c6c6c6] bg-[#eeeeee] rounded-b-lg flex justify-between items-center">
          <div className="text-xs text-[#474747]">
            <span>Showing <strong>{filteredRows.length}</strong> items • <strong>{totalLabels}</strong> total labels to print</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 py-1.5 border border-[#75777e] rounded text-[#141414] text-xs font-semibold hover:bg-[#e8e8e8] transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-6 py-1.5 bg-[#141414] text-white rounded text-xs font-bold hover:bg-[#2a2a2a] transition-colors shadow-sm flex items-center gap-1"
            >
              <Check size={14} />
              OK
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
