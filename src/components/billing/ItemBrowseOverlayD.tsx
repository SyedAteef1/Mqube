import React, { useState, useMemo, useEffect, useRef } from "react";
import { Product } from "../../types.ts";
import { ItemBrowseFilterColumn } from "./types.ts";

interface ItemBrowseOverlayModalProps {
  isOpen: boolean;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onClose: () => void;
}

const DEFAULT_COLUMNS: ItemBrowseFilterColumn[] = [
  { id: "any", name: "[Any Column]", condition: "Contains", checked: true },
  { id: "code", name: "Stock Number", condition: "Contains", checked: true },
  { id: "name", name: "Item Desc", condition: "Contains", checked: true },
  { id: "category", name: "Product", condition: "Contains", checked: true },
  { id: "brand", name: "Brand", condition: "Contains", checked: true },
  { id: "styleCode", name: "Style", condition: "Contains", checked: true },
  { id: "color", name: "Shade", condition: "Contains", checked: true },
  { id: "size", name: "Size", condition: "Contains", checked: true },
  { id: "fibre", name: "Fibre", condition: "Contains", checked: false },
  { id: "finish", name: "Finish", condition: "Contains", checked: false }
];

export const ItemBrowseOverlayModal: React.FC<ItemBrowseOverlayModalProps> = ({
  isOpen,
  products,
  onSelectProduct,
  onClose
}) => {
  const [columns, setColumns] = useState<ItemBrowseFilterColumn[]>(DEFAULT_COLUMNS);
  const [selectedColId, setSelectedColId] = useState<string>("code");
  const [searchValue, setSearchValue] = useState("");
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchValue("");
      setSelectedRowIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const activeColumn = useMemo(() => {
    return columns.find(c => c.id === selectedColId) || columns[1];
  }, [columns, selectedColId]);

  const filteredProducts = useMemo(() => {
    if (!searchValue.trim()) return products;
    const term = searchValue.toLowerCase().trim();

    return products.filter(p => {
      if (selectedColId === "any") {
        return (
          p.code?.toLowerCase().includes(term) ||
          p.name?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term) ||
          p.styleCode?.toLowerCase().includes(term) ||
          p.color?.toLowerCase().includes(term) ||
          p.size?.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase().includes(term)
        );
      }

      let val = "";
      if (selectedColId === "code") val = p.code || "";
      else if (selectedColId === "name") val = p.name || "";
      else if (selectedColId === "category") val = p.category || "";
      else if (selectedColId === "brand") val = p.brand || "";
      else if (selectedColId === "styleCode") val = p.styleCode || "";
      else if (selectedColId === "color") val = p.color || "";
      else if (selectedColId === "size") val = p.size || "";
      else if (p.attributes) {
        val = String(p.attributes[selectedColId] || "");
      }

      val = val.toLowerCase();
      if (activeColumn.condition === "Equals") return val === term;
      if (activeColumn.condition === "Starts With") return val.startsWith(term);
      if (activeColumn.condition === "Ends With") return val.endsWith(term);
      return val.includes(term);
    });
  }, [products, searchValue, selectedColId, activeColumn]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedRowIndex(prev => (prev + 1) % (filteredProducts.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedRowIndex(prev => (prev - 1 + (filteredProducts.length || 1)) % (filteredProducts.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts[selectedRowIndex]) {
        onSelectProduct(filteredProducts[selectedRowIndex]);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-150"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-[#fafafa] text-[#1b1b1b] w-full max-w-5xl h-[85vh] max-h-[720px] rounded-lg shadow-2xl border border-[#c7c7c7] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#252525] text-white px-4 py-2.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span className="font-bold text-sm tracking-wide">Item Attribute & Column Browser</span>
            <span className="text-xs bg-[#494949] text-[#e2e2e2] px-2 py-0.5 rounded font-mono font-semibold ml-2">
              {filteredProducts.length} Matches
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 2-Pane Split Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane: Column Filter Checklist */}
          <div className="w-72 bg-[#ededed] border-r border-[#c7c7c7] flex flex-col shrink-0">
            <div className="p-2 bg-[#e2e2e2] border-b border-[#c7c7c7] text-[11px] font-bold text-[#252525] uppercase tracking-wider flex justify-between items-center">
              <span>Filter Columns</span>
              <span className="text-[10px] text-[#5e5e5e]">Select target</span>
            </div>

            <div className="flex-1 overflow-y-auto p-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#e8e8e8] text-[10px] uppercase font-bold text-[#464646] sticky top-0">
                  <tr>
                    <th className="p-1 w-6"></th>
                    <th className="p-1">Column</th>
                    <th className="p-1 w-20">Cond.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c7c7c7]/40 font-medium">
                  {columns.map((col, idx) => {
                    const isSelectedCol = col.id === selectedColId;
                    return (
                      <tr 
                        key={col.id}
                        onClick={() => setSelectedColId(col.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelectedCol ? "bg-[#dcdcdc] text-[#252525] font-bold" : "hover:bg-white"
                        }`}
                      >
                        <td className="p-1 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={col.checked}
                            onChange={(e) => {
                              const updated = [...columns];
                              updated[idx].checked = e.target.checked;
                              setColumns(updated);
                            }}
                            className="rounded border-[#767676] text-[#252525] focus:ring-0"
                          />
                        </td>
                        <td className="p-1 truncate">{col.name}</td>
                        <td className="p-1 text-[10px] text-[#5e5e5e]">
                          <select
                            value={col.condition}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const updated = [...columns];
                              updated[idx].condition = e.target.value as any;
                              setColumns(updated);
                            }}
                            className="bg-transparent border border-[#c7c7c7] rounded text-[10px] py-0 px-1 font-mono focus:ring-0"
                          >
                            <option value="Contains">Contains</option>
                            <option value="Equals">Equals</option>
                            <option value="Starts With">Starts With</option>
                            <option value="Ends With">Ends With</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Left Bottom Search Box */}
            <div className="p-2 border-t border-[#c7c7c7] bg-[#f4f4f4] shrink-0">
              <label className="text-[11px] font-bold text-[#464646] block mb-1">
                Search Value ({activeColumn.name})
              </label>
              <div className="flex gap-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setSelectedRowIndex(0);
                  }}
                  placeholder="Enter search term..."
                  className="flex-1 h-7 border border-[#767676] rounded px-2 text-xs focus:ring-1 focus:ring-[#252525] outline-none bg-white shadow-inner"
                />
                <button 
                  type="button"
                  className="bg-[#252525] text-white h-7 px-2 rounded hover:bg-[#373737] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Pane: Search Results */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="p-2 bg-[#e8e8e8] border-b border-[#c7c7c7] flex justify-between items-center shrink-0">
              <span className="text-[11px] font-bold uppercase text-[#464646] tracking-wider">
                Matching Inventory Records
              </span>
              <span className="text-xs font-mono font-bold text-[#252525]">
                Records: {filteredProducts.length}
              </span>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                <thead className="sticky top-0 z-10 bg-[#f4f4f4] border-b border-[#c7c7c7] text-[11px] font-bold text-[#464646]">
                  <tr>
                    <th className="px-3 py-2 border-r border-[#c7c7c7]/60">Stock Number</th>
                    <th className="px-3 py-2 border-r border-[#c7c7c7]/60">Item Desc</th>
                    <th className="px-3 py-2 border-r border-[#c7c7c7]/60">Product</th>
                    <th className="px-3 py-2 border-r border-[#c7c7c7]/60">Brand</th>
                    <th className="px-3 py-2 border-r border-[#c7c7c7]/60">Style</th>
                    <th className="px-3 py-2 border-r border-[#c7c7c7]/60">Shade</th>
                    <th className="px-3 py-2 text-right">MRP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e2e2] font-medium text-[#1b1b1b]">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#767676]">
                        <span className="material-symbols-outlined text-3xl mb-1 text-[#767676]/60">search_off</span>
                        <p className="font-semibold text-xs">No records match current attribute filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.slice(0, 100).map((p, idx) => {
                      const isSelected = idx === selectedRowIndex;
                      return (
                        <tr
                          key={p.id || p.code}
                          onClick={() => {
                            onSelectProduct(p);
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedRowIndex(idx)}
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? "bg-[#dcdcdc] text-[#252525] font-bold border-l-4 border-l-[#252525]" 
                              : "hover:bg-[#f4f4f4]"
                          }`}
                        >
                          <td className="px-3 py-1.5 font-mono font-bold border-r border-[#c7c7c7]/60">{p.code}</td>
                          <td className="px-3 py-1.5 border-r border-[#c7c7c7]/60 truncate max-w-xs font-semibold">{p.name}</td>
                          <td className="px-3 py-1.5 border-r border-[#c7c7c7]/60">{p.category || "-"}</td>
                          <td className="px-3 py-1.5 border-r border-[#c7c7c7]/60">{p.brand || "-"}</td>
                          <td className="px-3 py-1.5 border-r border-[#c7c7c7]/60">{p.styleCode || "-"}</td>
                          <td className="px-3 py-1.5 border-r border-[#c7c7c7]/60">{p.color || "-"}</td>
                          <td className="px-3 py-1.5 text-right font-mono font-bold">
                            ₹{(p.mrp || p.price || 0).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#e8e8e8] border-t border-[#c7c7c7] px-4 py-2.5 flex justify-between items-center shrink-0 text-xs">
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setColumns(DEFAULT_COLUMNS)}
              className="bg-white border border-[#c7c7c7] text-[11px] font-bold uppercase px-3 py-1 rounded hover:bg-[#fafafa]"
            >
              Apply Default
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={!filteredProducts[selectedRowIndex]}
              onClick={() => {
                if (filteredProducts[selectedRowIndex]) {
                  onSelectProduct(filteredProducts[selectedRowIndex]);
                  onClose();
                }
              }}
              className="bg-[#252525] hover:bg-[#373737] disabled:opacity-40 text-white text-xs font-bold uppercase px-6 py-1.5 rounded transition-colors flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-[15px]">check</span>
              Select Item
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-[#fafafa] hover:bg-[#e8e8e8] text-[#464646] text-xs font-bold uppercase px-4 py-1.5 rounded border border-[#c7c7c7] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
