import React from "react";
import { MasterListScreen } from "./global/master/MasterListScreen.tsx";
import { supplierMasterConfig } from "./global/configs/supplierMaster.con.tsx";

export interface SupplierDashboardTabProps {
  currentUser?: { role: string; name: string } | null;
  onNotification?: (title: string, message: string, type: "success" | "error" | "info" | "warning") => void;
}

export const SupplierDashboardTab: React.FC<SupplierDashboardTabProps> = ({ currentUser, onNotification }) => {
  return (
    <MasterListScreen
      config={supplierMasterConfig}
      currentUser={currentUser}
      onNotification={onNotification}
    />
  );
};
