import React from "react";
import { X, Keyboard, Command } from "lucide-react";

interface TileFlowKeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ItemShortcuts: React.FC<TileFlowKeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: "Tab Navigation",
      items: [
        { key: "Alt + 1", desc: "Open View Configuration Tab" },
        { key: "Alt + 2", desc: "Open Item Details Entry Tab" },
        { key: "Alt + 3", desc: "Open Bulk Paste / Import Studio" },
        { key: "Alt + 4", desc: "Open Attributes Catalog" },
        { key: "Alt + 5", desc: "Open Image Path Config" },
        { key: "Alt + 6", desc: "Open Variant Templates" }
      ]
    },
    {
      title: "Grid & Data Editing",
      items: [
        { key: "F1", desc: "Show Keyboard Shortcuts Guide" },
        { key: "F2", desc: "Open Select Codes & SKU/Barcode Generator" },
        { key: "Ctrl + S / Ok", desc: "Save / Commit Items to PostgreSQL Database" },
        { key: "Ctrl + F / Replace", desc: "Open Find & Replace Data Utility" },
        { key: "Ctrl + V", desc: "Paste Multiple Rows from Excel / CSV" },
        { key: "Esc", desc: "Close Active Modal / Cancel Operation" }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1b1b1b] border border-[#c7c7c7] dark:border-[#464646] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden text-[#1c1c1c] dark:text-[#f1f1f1]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#eeeeee] dark:border-[#303030] bg-[#f4f4f4] dark:bg-[#1c1c1c]">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-[#494949]" />
            <h3 className="text-sm font-bold">Item Master Keyboard Shortcuts Guide</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#76777d] hover:text-[#1c1c1c] dark:hover:text-white p-1 rounded-md transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {shortcutGroups.map((grp, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-[#373737] dark:text-[#c5c5c5]">
                {grp.title}
              </h4>
              <div className="bg-[#f9f9f9] dark:bg-[#1c1c1c] border border-[#eeeeee] dark:border-[#303030] rounded-lg divide-y divide-[#eeeeee] dark:divide-[#303030]">
                {grp.items.map((item, iIdx) => (
                  <div key={iIdx} className="p-2.5 flex items-center justify-between">
                    <span className="font-semibold text-[#5e5e5e] dark:text-[#c6c6c6]">{item.desc}</span>
                    <kbd className="px-2 py-1 bg-white dark:bg-[#303030] border border-[#c7c7c7] dark:border-[#464646] rounded font-mono font-bold text-[11px] text-[#494949] dark:text-[#e2e2e2] shadow-xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#eeeeee] dark:border-[#303030] bg-[#f4f4f4] dark:bg-[#1c1c1c] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#494949] hover:bg-[#373737] text-white rounded font-bold text-xs shadow-xs transition"
          >
            Close (Esc)
          </button>
        </div>

      </div>
    </div>
  );
};

export default ItemShortcuts;
