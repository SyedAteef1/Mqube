import React from "react";
import { CustMasterWs } from "./customer/CustMasterWs.tsx";

export interface CustomerMasterTabProps {
  currentUser?: { role: string; name: string } | null;
  onNotification?: (title: string, message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export const CustomerMasterTab: React.FC<CustomerMasterTabProps> = ({ currentUser, onNotification }) => {
  return (
    <CustMasterWs
      currentUser={currentUser}
      onNotification={onNotification}
    />
  );
};

