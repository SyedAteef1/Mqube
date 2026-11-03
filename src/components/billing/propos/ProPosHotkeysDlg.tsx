import React from "react";
import { X, Keyboard, Check, Command } from "lucide-react";

interface TileFlowProPosHotkeysDlgProps {
  onClose: () => void;
}

const HOTKEY_GROUPS = [
  {
    category: "POS Core Activities",
    items: [
      { key: "Alt + 1", desc: "Create a new bill (reset terminal / new transaction)" },
      { key: "Alt + 2", desc: "Void / Cancel a bill generated earlier" },
      { key: "Alt + 3", desc: "Record sales return WITH reference to earlier invoice" },
      { key: "Alt + 5", desc: "Record sales return WITHOUT reference (blind return)" },
      { key: "Alt + 6", desc: "Reprint an existing bill or sales return document" },
      { key: "Alt + H", desc: "Show Hotkeys and shortcuts reference guide" }
    ]
  },
  {
    category: "Payment & Settlement",
    items: [
      { key: "F7", desc: "Exact Cash settlement and immediate confirmation" },
      { key: "F8", desc: "Open Multi-Tender Settlement modal (Split payment)" },
      { key: "F9", desc: "Display and toggle bill total values breakdown" },
      { key: "F10", desc: "Instant Settle & Print Tax Invoice receipt" }
    ]
  },
  {
    category: "Header & Customer Search",
    items: [
      { key: "F2", desc: "Open Customer Browse & Search Window" },
      { key: "Alt + S", desc: "Hold / Suspend current active cart to queue" },
      { key: "Alt + R", desc: "Recall suspended bills or sales advice slips" },
      { key: "Alt + I", desc: "Open PDT Import window (File or Transaction)" }
    ]
  },
  {
    category: "Direct Entry Grid Navigation",
    items: [
      { key: "Enter", desc: "Accept item from Direct Entry Grid into Item Details Grid" },
      { key: "Tab", desc: "Advance focus between Stock No, Qty, Rate, and Disc cells" }
    ]
  }
];

export const TileFlowProPosHotkeysDlg: React.FC<TileFlowProPosHotkeysDlgProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-[#1c1c1c] text-[#1c1c1c] dark:text-[#f1f1f1] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#c6c6c6] dark:border-[#474747] max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-[#c6c6c6] dark:border-[#474747] bg-[#f9f9f9] dark:bg-[#1b1b1b] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#272727] text-white rounded-lg">
              <Keyboard size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b1b1b] dark:text-white">POS Hot Keys &amp; Shortcuts [Alt+H]</h3>
              <p className="text-xs text-[#5e5e5e] dark:text-[#c6c6c6]">Standard Shoper 9 retail keyboard shortcuts &amp; quick action triggers.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-[#5e5e5e] hover:bg-[#f4f4f4] p-1.5 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {HOTKEY_GROUPS.map((grp, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#272727] dark:text-[#bababa] pb-1 border-b border-[#eeeeee] dark:border-[#303030]">
                {grp.category}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {grp.items.map((item, iIdx) => (
                  <div 
                    key={iIdx} 
                    className="flex items-center justify-between p-2 rounded-lg bg-[#f9f9f9] dark:bg-[#1b1b1b] border border-[#eeeeee] dark:border-[#303030]"
                  >
                    <span className="text-xs text-[#1b1b1b] dark:text-white">{item.desc}</span>
                    <kbd className="px-2 py-0.5 bg-white dark:bg-[#303030] border border-[#c6c6c6] dark:border-[#474747] rounded text-xs font-mono font-bold text-[#272727] dark:text-[#bababa] shadow-2xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#c6c6c6] dark:border-[#474747] bg-[#f9f9f9] dark:bg-[#1b1b1b] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#272727] text-white rounded-xl text-xs font-bold hover:bg-[#414141] transition"
          >
            Close [Esc]
          </button>
        </div>

      </div>
    </div>
  );
};

export default TileFlowProPosHotkeysDlg;
