import React, { useState } from "react";
import { X, Sparkles, CheckCircle, Barcode, Hash } from "lucide-react";
import { generateSkuCode } from "../../services/skuGenerationEngine.ts";

interface TileFlowCodeSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCode: (code: string, barcode: string) => void;
  currentRow?: {
    brand?: string;
    styleCode?: string;
    colour?: string;
    size?: string;
    name?: string;
  };
}

export const CodeSelectDlg: React.FC<TileFlowCodeSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectCode,
  currentRow = {}
}) => {
  const [prefix, setPrefix] = useState<string>("SMRT");
  const [separator, setSeparator] = useState<string>("-");
  const [includeSize, setIncludeSize] = useState<boolean>(true);
  const [includeColor, setIncludeColor] = useState<boolean>(true);
  const [customSku, setCustomSku] = useState<string>(() => {
    return generateSkuCode({
      brand: currentRow.brand || "MQube",
      styleCode: currentRow.styleCode || "ITEM",
      colour: currentRow.colour || "BLK",
      size: currentRow.size || "M"
    });
  });
  const [customBarcode, setCustomBarcode] = useState<string>(() => {
    return `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  });

  if (!isOpen) return null;

  const handleRegenerate = () => {
    const newSku = generateSkuCode({
      brand: currentRow.brand || prefix,
      styleCode: currentRow.styleCode || "ITEM",
      colour: includeColor ? currentRow.colour : undefined,
      size: includeSize ? currentRow.size : undefined
    }, {
      mode: "DERIVED",
      delimiter: separator || "-",
      prefix: prefix
    });
    setCustomSku(newSku);
    setCustomBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  };

  const handleApply = () => {
    onSelectCode(customSku, customBarcode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1b1b1b] border border-[#c7c7c7] dark:border-[#464646] rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-[#1c1c1c] dark:text-[#f1f1f1]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#eeeeee] dark:border-[#303030] bg-[#f4f4f4] dark:bg-[#1c1c1c]">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#494949]" />
            <h3 className="text-sm font-bold">SKU &amp; Barcode Generator</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#76777d] hover:text-[#1c1c1c] dark:hover:text-white p-1 rounded-md transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          
          {/* Live Preview Card */}
          <div className="p-3 bg-[#ededed] dark:bg-[#2f2f2f] rounded-lg border border-[#d2d2d2] dark:border-[#464646] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-[#373737] dark:text-[#c5c5c5] uppercase flex items-center gap-1.5">
                <Hash size={14} /> Generated SKU Code:
              </span>
              <span className="font-mono font-bold text-xs bg-white dark:bg-[#1b1b1b] px-2 py-0.5 rounded border border-[#d2d2d2] dark:border-[#464646]">
                {customSku}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-[#373737] dark:text-[#c5c5c5] uppercase flex items-center gap-1.5">
                <Barcode size={14} /> EAN-13 Barcode:
              </span>
              <span className="font-mono font-bold text-xs bg-white dark:bg-[#1b1b1b] px-2 py-0.5 rounded border border-[#d2d2d2] dark:border-[#464646]">
                {customBarcode}
              </span>
            </div>
          </div>

          {/* Form Options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#5e5e5e] dark:text-[#c6c6c6] font-bold uppercase text-[10px] block mb-1">Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
                className="w-full p-2 bg-white dark:bg-[#1c1c1c] border border-[#c7c7c7] dark:border-[#464646] rounded font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="text-[#5e5e5e] dark:text-[#c6c6c6] font-bold uppercase text-[10px] block mb-1">Separator</label>
              <select
                value={separator}
                onChange={e => setSeparator(e.target.value)}
                className="w-full p-2 bg-white dark:bg-[#1c1c1c] border border-[#c7c7c7] dark:border-[#464646] rounded font-semibold text-xs"
              >
                <option value="-">Hyphen (-)</option>
                <option value="_">Underscore (_)</option>
                <option value="/">Slash (/)</option>
                <option value="">None</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={includeSize}
                onChange={e => setIncludeSize(e.target.checked)}
                className="rounded"
              />
              <span>Include Size</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={includeColor}
                onChange={e => setIncludeColor(e.target.checked)}
                className="rounded"
              />
              <span>Include Color</span>
            </label>
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleRegenerate}
              className="text-[#494949] hover:underline font-bold text-xs flex items-center gap-1"
            >
              <Sparkles size={12} /> Regenerate Pattern
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-[#eeeeee] dark:border-[#303030] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#76777d] rounded font-semibold text-xs hover:bg-[#eeeeee] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-[#494949] hover:bg-[#373737] text-white rounded font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle size={14} />
              Apply Code &amp; Barcode
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CodeSelectDlg;
