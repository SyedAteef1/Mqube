import React from "react";
import { MasterListScreen } from "./global/master/MasterListScreen.tsx";
import { posProfilesConfig } from "./global/configs/posProfiles.config.tsx";
import { POSProfile } from "../types.ts";

export interface PosProfilesTabProps {
  profiles?: POSProfile[];
  onRefreshData?: () => void;
  onNotification?: (title: string, msg: string, type: "success" | "error") => void;
  currentUser?: { role: string; name: string } | null;
}

export const PosProfilesTab: React.FC<PosProfilesTabProps> = ({
  onNotification,
  currentUser
}) => {
  return (
    <MasterListScreen<POSProfile>
      config={posProfilesConfig}
      currentUser={currentUser}
      onNotification={(t, m, type) => {
        if (onNotification) onNotification(t, m, type === "warning" || type === "info" ? "success" : type);
      }}
    />
  );
};
