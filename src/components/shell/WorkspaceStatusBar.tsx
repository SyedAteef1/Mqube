import React, { useEffect, useState } from "react";
import { Building2, GitBranch, UserRound } from "lucide-react";

interface WorkspaceStatusBarProps {
  activeModuleTitle: string;
  userName?: string;
  userRole?: string;
}

const readWorkspaceValue = (key: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) || fallback;
};

export const WorkspaceStatusBar: React.FC<WorkspaceStatusBarProps> = ({
  activeModuleTitle,
  userName = "Operator",
  userRole = "Operator",
}) => {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [companyName, setCompanyName] = useState("MQube Workspace");
  const [companyCode, setCompanyCode] = useState("001");
  const [branchName, setBranchName] = useState("Main Branch");
  const [branchCode, setBranchCode] = useState("MAIN");

  useEffect(() => {
    const syncWorkspace = () => {
      setCompanyName(readWorkspaceValue("tileflow_company_name", "MQube Workspace"));
      setCompanyCode(readWorkspaceValue("tileflow_company_code", "001"));
      setBranchName(readWorkspaceValue("tileflow_branch_name", "Main Branch"));
      setBranchCode(readWorkspaceValue("tileflow_branch_code", readWorkspaceValue("tileflow_branch_id", "MAIN")));
    };
    const updateOnline = () => setOnline(navigator.onLine);

    syncWorkspace();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    window.addEventListener("tileflow_company_context_updated", syncWorkspace);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener("tileflow_company_context_updated", syncWorkspace);
    };
  }, []);

  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 h-8 border-t border-[#e5e5e5] bg-[#fafafa] px-3 text-xs text-[#525252]">
      <div className="mx-auto flex h-full max-w-[1800px] items-center gap-3 overflow-hidden whitespace-nowrap">
        <div className="flex min-w-0 items-center gap-1.5 text-[#252525]" title={`${companyName} (${companyCode})`}>
          <Building2 size={13} className="shrink-0 text-[#737373]" />
          <span className="max-w-[240px] truncate font-medium">{companyName}</span>
        </div>
        <span className="h-3.5 w-px shrink-0 bg-[#d1d1d1]" />
        <div className="flex min-w-0 items-center gap-1.5" title={`${branchName} (${branchCode})`}>
          <GitBranch size={12} className="shrink-0 text-[#737373]" />
          <span className="max-w-[180px] truncate">{branchName}</span>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <UserRound size={12} className="text-[#737373]" />
          <span className="max-w-[140px] truncate">{userName}</span>
          <span className="text-[#a3a3a3]">·</span>
          <span className="text-[#737373]">{userRole}</span>
          {!online && <span className="ml-2 font-medium text-[#b91c1c]">Offline</span>}
        </span>
      </div>
    </footer>
  );
};
