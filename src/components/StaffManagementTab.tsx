import React from "react";
import { MasterListScreen } from "./global/master/MasterListScreen.tsx";
import { staffMasterConfig } from "./global/configs/staffMaster.config.tsx";
import { User } from "../types.ts";

export interface StaffManagementTabProps {
  currentUser?: { role: string; name: string } | null;
  onNotification?: (title: string, message: string, type: "success" | "error" | "info" | "warning") => void;
}

export const StaffManagementTab: React.FC<StaffManagementTabProps> = ({ currentUser, onNotification }) => {
  return (
    <MasterListScreen<User>
      config={staffMasterConfig}
      currentUser={currentUser}
      onNotification={onNotification}
    />
  );
};
