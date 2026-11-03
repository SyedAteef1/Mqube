import React, { useState } from "react";
import { X, Replace, Search } from "lucide-react";

interface TileFlowReplaceDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplace: (targetField: string, findText: string, replaceText: string, matchCase: boolean) => void;
  fields: { key: string; label: string }[];
}

export const ReplaceDataDlg: React.FC<TileFlowReplaceDataModalProps> = ({
  isOpen,
  onClose,
  onReplace,
  fields
}) => {
  const [targetField, setTargetField] = useState<string>("ALL");
  const [findText, setFindText] = useState<string>("");
  const [replaceText, setReplaceText] = useState<string>("");
  const [matchCase, setMatchCase] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findText) return;
    onReplace(targetField, findText, replaceText, matchCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1b1b1b] border border-[#c7c7c7] dark:border-[#464646] rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-[#1c1c1c] dark:text-[#f1f1f1]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#eeeeee] dark:border-[#303030] bg-[#f4f4f4] dark:bg-[#1c1c1c]">
          <div className="flex items-center gap-2">
            <Replace size={18} className="text-[#494949]" />
            <h3 className="text-sm font-bold">Replace Data Utility</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#76777d] hover:text-[#1c1c1c] dark:hover:text-white p-1 rounded-md transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div>
            <label className="text-[#5e5e5e] dark:text-[#c6c6c6] font-bold uppercase text-[10px] block mb-1">Target Column / Field</label>
            <select
              value={targetField}
              onChange={e => setTargetField(e.target.value)}
              className="w-full p-2 bg-white dark:bg-[#1c1c1c] border border-[#c7c7c7] dark:border-[#464646] rounded font-semibold text-xs outline-none focus:ring-1 focus:ring-[#494949]"
            >
              <option value="ALL">All Editable Columns &amp; Attributes</option>
              {fields.map(f => (
                <option key={f.key} value={f.key}>{f.label} ({f.key})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[#5e5e5e] dark:text-[#c6c6c6] font-bold uppercase text-[10px] block mb-1">Find Text*</label>
            <input
              type="text"
              required
              value={findText}
              onChange={e => setFindText(e.target.value)}
              placeholder="e.g. Cotton 100%, Old Brand, S"
              className="w-full p-2 bg-white dark:bg-[#1c1c1c] border border-[#c7c7c7] dark:border-[#464646] rounded text-xs outline-none focus:ring-1 focus:ring-[#494949]"
            />
          </div>

          <div>
            <label className="text-[#5e5e5e] dark:text-[#c6c6c6] font-bold uppercase text-[10px] block mb-1">Replace With</label>
            <input
              type="text"
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              placeholder="e.g. Organic Cotton, New Brand, M"
              className="w-full p-2 bg-white dark:bg-[#1c1c1c] border border-[#c7c7c7] dark:border-[#464646] rounded text-xs outline-none focus:ring-1 focus:ring-[#494949]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={e => setMatchCase(e.target.checked)}
                className="rounded"
              />
              <span>Match Case Exactly</span>
            </label>
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
              type="submit"
              className="px-5 py-2 bg-[#494949] hover:bg-[#373737] text-white rounded font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Replace size={14} />
              Replace All Matches
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ReplaceDataDlg;
