import React from "react";
import { PoGenerateTab } from "./purchase/PoGenerateTab.tsx";
import { Product } from "../types.ts";

interface PurchaseStudioTabProps {
  products?: Product[];
  onRefreshProducts?: () => void;
  onNotification?: (title: string, message: string, type?: "success" | "error") => void;
  currentUser?: { role: string; name: string } | null;
  onClose?: () => void;
}

export const PurchaseStudioTab: React.FC<PurchaseStudioTabProps> = ({
  products = [],
  onRefreshProducts,
  onNotification,
  currentUser,
  onClose
}) => {
  return (
    <PoGenerateTab
      products={products}
      currentUser={currentUser}
      onNotification={onNotification}
      onClose={onClose}
    />
  );
};

export default PurchaseStudioTab;
