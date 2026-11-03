import React from "react";
import { HelpCircle, Database, Filter, Check, X } from "lucide-react";

interface TileFlowDataLoadConfirmationModalProps {
  isOpen: boolean;
  onConfirm: (loadAll: boolean) => void;
  totalRecordsCount: number;
}

export const DataLoadConfirm: React.FC<TileFlowDataLoadConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  totalRecordsCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1b1b1b] border border-[#c7c7c7] dark:border-[#464646] rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-[#1c1c1c] dark:text-[#f1f1f1]">
        
        {/* Header */}
        <div className="p-4 border-b border-[#eeeeee] dark:border-[#303030] bg-[#f4f4f4] dark:bg-[#1c1c1c] flex items-center gap-2">
          <HelpCircle size={20} className="text-[#494949]" />
          <h3 className="text-sm font-bold">Data Loading Confirmation</h3>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-sm font-medium text-[#1c1c1c] dark:text-white leading-relaxed">
            Do you want to display all <strong>{totalRecordsCount}</strong> item records in the Item Details grid?
          </p>
          
          <div className="p-3 bg-[#ededed] dark:bg-[#2f2f2f] border border-[#d2d2d2] dark:border-[#464646] rounded-lg space-y-2 text-[11px] text-[#373737] dark:text-[#c5c5c5]">
            <p><strong>• Yes:</strong> Loads all item records directly into the grid matrix.</p>
            <p><strong>• No:</strong> Opens a blank workspace where you can apply specific Category or Brand filters before loading.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#eeeeee] dark:border-[#303030] bg-[#f4f4f4] dark:bg-[#1c1c1c] flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onConfirm(false)}
            className="px-4 py-2 border border-[#c7c7c7] dark:border-[#464646] bg-white dark:bg-[#303030] hover:bg-[#eeeeee] rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Filter size={14} className="text-[#494949]" />
            No (Apply Filter First)
          </button>
          <button
            type="button"
            onClick={() => onConfirm(true)}
            className="px-5 py-2 bg-[#494949] hover:bg-[#373737] text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Check size={14} />
            Yes (Load All Records)
          </button>
        </div>

      </div>
    </div>
  );
};

export default DataLoadConfirm;
