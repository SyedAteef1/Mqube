import React from "react";
import { Product } from "../types.ts";
import { ItemMasterWs } from "./itemMaster/ItemMasterWs.tsx";

export interface ItemMasterTabProps {
  products?: Product[];
  onRefreshProducts?: () => Promise<void>;
  onNotification?: (title: string, message: string, type?: "success" | "error" | "info" | "warning") => void;
  currentUser?: { role: string; name: string } | null;
  initialSubTab?: string;
  onClose?: () => void;
}

export const ItemMasterTab: React.FC<ItemMasterTabProps> = ({
  products = [],
  onRefreshProducts,
  onNotification,
  currentUser,
  onClose
}) => {
  return (
    <ItemMasterWs
      products={products}
      onRefreshProducts={onRefreshProducts}
      onNotification={onNotification}
      currentUser={currentUser}
      onClose={onClose}
    />
  );
};

export default ItemMasterTab;
