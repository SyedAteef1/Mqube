import { ReactNode } from "react";

export type ContextCategory = "Workflow" | "Enterprise" | "Document" | "Developer" | "System" | "Analytics";

export interface ContextData {
  module: string;             // e.g., "sales", "inventory", "purchase", "item-master"
  type: string;               // e.g., "invoice", "product", "supplier", "purchase-order", "customer"
  object?: any;               // The actual model data (e.g., an invoice object)
  count?: number;             // Selection count (for bulk operations)
  role?: string;              // Current user role ("Store Manager", "Cashier", "Admin")
  permissions?: string[];     // User specific permissions
  branch?: string;            // Active branch or outlet
  companySettings?: any;      // Custom enterprise settings
  featureFlags?: Record<string, boolean>;
}

export interface ContextAction {
  id: string;
  label: string;
  icon: string;               // Lucide icon name or Material Symbol name
  description?: string;
  category?: ContextCategory;
  shortcut?: string;          // Keyboard shortcut string, e.g., "Ctrl+Shift+P" or "P"
  disabled?: boolean | ((context: ContextData) => boolean);
  visible?: boolean | ((context: ContextData) => boolean);
  isFavorite?: boolean;
  isRecent?: boolean;
  isPinned?: boolean;
  isAiRecommended?: boolean | ((context: ContextData) => boolean); // AI/ACAS Predictive Promoted
  onClick: (context: ContextData) => void | Promise<void>;
}
