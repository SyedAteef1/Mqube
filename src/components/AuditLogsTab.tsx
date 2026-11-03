import React from "react";
import { LedgerScreen } from "./global/ledger/LedgerScreen.tsx";
import { auditLogsConfig } from "./global/ledger/configs/auditLogs.config.tsx";

export const AuditLogsTab: React.FC = () => {
  return <LedgerScreen config={auditLogsConfig} />;
};
