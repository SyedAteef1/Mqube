import React, { useState } from "react";
import { ShoppingCart, Users, FileText, Zap, X, Box } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLayoutEngine } from "../layout_engine/layout_store.js";
import { useResponsiveLayout } from "../layout_engine/responsive_manager.js";
import { useWorkspace } from "../contexts/WorkspaceContext.tsx";

export const QuickActionsMenu: React.FC = () => {
  // Quick Action Palette disabled per system directive
  return null;
};
