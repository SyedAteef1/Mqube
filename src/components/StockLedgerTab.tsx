import React from "react";
import { LedgerScreen } from "./global/ledger/LedgerScreen.tsx";
import { stockLedgerConfig } from "./global/ledger/configs/stockLedger.config.tsx";

interface StockLedgerTabProps {
  currentUser?: { role: string; name: string } | null;
}

export const StockLedgerTab: React.FC<StockLedgerTabProps> = () => {
  return <LedgerScreen config={stockLedgerConfig} />;
};
