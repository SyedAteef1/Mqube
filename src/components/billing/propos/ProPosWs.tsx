import React, { useState } from "react";
import { TileFlowProPosBillinginal } from "./ProPosBillingTerm.tsx";
import { TileFlowProPosEodReportw } from "./ProPosEodReportVie.tsx";
import { TileFlowDailyReportsDashDashboard } from "./ProPosDailyReports.tsx";
import { TileFlowPromotionEngineine } from "./ProPosPromotionEng.tsx";
import { TileFlowCommissionBuildilder } from "./ProPosCommissionBu.tsx";
import { BillingTerm } from "../BillingTerm.tsx";
import { Product, POSProfile, Shift } from "../../../types.ts";
import { 
  CheckCircle, 
  AlertCircle, 
  Info
} from "lucide-react";

type ProPosActiveTab = "BILLING" | "INVOICING" | "EOD_Z_REPORT" | "DAILY_REPORTS" | "PROMOTIONS" | "COMMISSIONS";

interface TileFlowProPosWorkspaceProps {
  products?: Product[];
  profiles?: POSProfile[];
  shifts?: Shift[];
  onRefreshData?: () => void;
  onNotification?: (title: string, msg: string, type: "success" | "error") => void;
  initialTab?: ProPosActiveTab;
}

export const ProPosWs: React.FC<TileFlowProPosWorkspaceProps> = ({
  products = [],
  profiles = [],
  shifts = [],
  onRefreshData,
  onNotification,
  initialTab = "INVOICING",
}) => {
  const [activeTab, setActiveTab] = useState<ProPosActiveTab>(initialTab);
  const [toast, setToast] = useState<{ title: string; message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ title, message, type });
    onNotification?.(title, message, type === "error" ? "error" : "success");
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="h-full flex flex-col bg-[#f9f9f9] dark:bg-[#1c1c1c] text-[#1c1c1c] dark:text-[#f1f1f1] overflow-hidden font-sans">
      
      {/* Billing workspace tabs */}
      <header className="bg-white dark:bg-[#1b1b1b] border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-6 px-5 h-11 shrink-0 z-20">
        <h1 className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">Billing</h1>
        <nav className="flex items-center gap-1 h-full">
          {([
            ["INVOICING", "Tax Invoice"],
            ["BILLING", "Speed POS Terminal"],
            ["EOD_Z_REPORT", "EOD Z-Report"],
            ["DAILY_REPORTS", "Shift Reports"],
            ["PROMOTIONS", "Promotions"],
            ["COMMISSIONS", "Commissions"],
          ] as [ProPosActiveTab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              aria-current={activeTab === tab ? "page" : undefined}
              onClick={() => setActiveTab(tab)}
              className={`relative h-full px-3 text-[13px] transition ${
                activeTab === tab
                  ? "font-semibold text-neutral-900 dark:text-white after:absolute after:left-3 after:right-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#171717] dark:after:bg-white"
                  : "font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Workspace Active View */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "INVOICING" && (
          <BillingTerm
            products={products}
            onNotification={showToast}
            onRefreshData={onRefreshData}
          />
        )}
        {activeTab === "BILLING" && (
          <TileFlowProPosBillinginal onNotification={showToast} />
        )}
        {activeTab === "EOD_Z_REPORT" && (
          <TileFlowProPosEodReportw
            onCommitCloseout={(eod) => {
              showToast("Register Closed", `Z-Report committed for shift ${eod.shiftId}`, "success");
            }}
            onNotification={showToast}
          />
        )}
        {activeTab === "DAILY_REPORTS" && (
          <TileFlowDailyReportsDashDashboard />
        )}
        {activeTab === "PROMOTIONS" && (
          <TileFlowPromotionEngineine />
        )}
        {activeTab === "COMMISSIONS" && (
          <TileFlowCommissionBuildilder />
        )}
      </div>

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`p-4 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-semibold ${
            toast.type === "success"
              ? "bg-[#dcfce7] text-[#166534] border-[#16a34a]"
              : toast.type === "error"
              ? "bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]"
              : "bg-[#e2e2e2] text-[#272727] border-[#272727]"
          }`}>
            {toast.type === "success" && <CheckCircle size={16} />}
            {toast.type === "error" && <AlertCircle size={16} />}
            {toast.type === "info" && <Info size={16} />}
            <div>
              <div className="font-bold">{toast.title}</div>
              <div className="text-[11px] opacity-90">{toast.message}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProPosWs;
