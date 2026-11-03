import React, { useState, useEffect } from "react";
import { 
  Package, 
  Settings, 
  Settings2, 
  Layers, 
  ClipboardPaste, 
  Database,
  Search, 
  FileSpreadsheet
} from "lucide-react";
import { Product } from "../../types.ts";
import { ItemDetailsGrid } from "./ItemDetailsGrid.tsx";
import { ItemViewConfig, ItemViewConfigState } from "./ItemViewConfig.tsx";
import { ItemMasterStudio } from "./ItemMasterStudio.tsx";
import { AttrMgmtStudio } from "./AttrMgmtStudio.tsx";
import { ImgPathStudio } from "./ImgPathStudio.tsx";
import { VariantTplSec } from "../VariantTemplateSec.tsx";

interface TileFlowItemMasterWorkspaceProps {
  products?: Product[];
  onRefreshProducts?: () => Promise<void>;
  onNotification?: (title: string, message: string, type?: "success" | "error" | "info" | "warning") => void;
  currentUser?: { role: string; name: string } | null;
  onClose?: () => void;
}

type WorkspaceNavTab = "item_details" | "view_config" | "imports" | "attributes" | "image_config" | "variants";

export const ItemMasterWs: React.FC<TileFlowItemMasterWorkspaceProps> = ({
  products = [],
  onRefreshProducts,
  onNotification,
  currentUser,
  onClose
}) => {
  const [activeNav, setActiveNav] = useState<WorkspaceNavTab>("item_details");

  const [viewConfig, setItemViewConfig] = useState<ItemViewConfigState>({
    viewMode: "grid",
    visibleColumns: [
      "code", "barcode", "name", "brand", "styleCode", "colour", "size",
      "mrp", "price", "gst_percentage", "hsn_code",
      "a1", "a2", "a3", "a4", "a5"
    ],
    frozenColumns: 2
  });

  const handleNotify = onNotification || (() => {});
  const handleRefresh = onRefreshProducts || (async () => {});

  // Global Alt+1, Alt+2, Alt+3 tab switching
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "1") {
        e.preventDefault();
        setActiveNav("view_config");
      } else if (e.altKey && e.key === "2") {
        e.preventDefault();
        setActiveNav("item_details");
      } else if (e.altKey && e.key === "3") {
        e.preventDefault();
        setActiveNav("imports");
      } else if (e.altKey && e.key === "4") {
        e.preventDefault();
        setActiveNav("attributes");
      } else if (e.altKey && e.key === "5") {
        e.preventDefault();
        setActiveNav("image_config");
      } else if (e.altKey && e.key === "6") {
        e.preventDefault();
        setActiveNav("variants");
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  return (
    <div className="bg-[#f9f9f9] dark:bg-[#1c1c1c] text-[#1c1c1c] dark:text-[#f1f1f1] h-screen w-full overflow-hidden flex font-sans select-none antialiased">
      
      {/* ── Left SideNavBar Matching Itemmaster3 ─────────────────────────── */}
      <nav className="bg-[#f3f3f3] dark:bg-[#1b1b1b] text-[#181818] dark:text-[#f1f1f1] w-64 h-screen border-r border-[#c7c7c7] dark:border-[#464646] flex flex-col py-4 px-3 shrink-0 z-20 shadow-xs">
        
        {/* Brand Title */}
        <div className="mb-6 px-3">
          <h2 className="text-lg font-bold text-[#373737] dark:text-[#c5c5c5] tracking-tight flex items-center gap-2">
            Item Master
          </h2>
          <p className="text-xs text-[#5e5e5e] dark:text-[#c6c6c6] font-medium mt-0.5">
            Management System
          </p>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex-1 space-y-1">
          <button
            type="button"
            onClick={() => setActiveNav("item_details")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition ${
              activeNav === "item_details"
                ? "bg-[#dfdfdf] dark:bg-[#494949] text-[#181818] dark:text-white shadow-xs"
                : "text-[#5e5e5e] dark:text-[#c6c6c6] hover:bg-[#e8e8e8] dark:hover:bg-[#2f2f2f]"
            }`}
          >
            <Package size={17} />
            <span>Item Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav("view_config")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition ${
              activeNav === "view_config"
                ? "bg-[#dfdfdf] dark:bg-[#494949] text-[#181818] dark:text-white shadow-xs"
                : "text-[#5e5e5e] dark:text-[#c6c6c6] hover:bg-[#e8e8e8] dark:hover:bg-[#2f2f2f]"
            }`}
          >
            <Settings2 size={17} />
            <span>View Configuration</span>
          </button>

          <div className="pt-2 pb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#767676] px-3">
              Tools &amp; Catalogs
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveNav("imports")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeNav === "imports"
                ? "bg-[#dfdfdf] dark:bg-[#494949] text-[#181818] dark:text-white shadow-xs"
                : "text-[#5e5e5e] dark:text-[#c6c6c6] hover:bg-[#e8e8e8] dark:hover:bg-[#2f2f2f]"
            }`}
          >
            <ClipboardPaste size={15} />
            <span>Imports &amp; Bulk Paste</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav("attributes")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeNav === "attributes"
                ? "bg-[#dfdfdf] dark:bg-[#494949] text-[#181818] dark:text-white shadow-xs"
                : "text-[#5e5e5e] dark:text-[#c6c6c6] hover:bg-[#e8e8e8] dark:hover:bg-[#2f2f2f]"
            }`}
          >
            <Database size={15} />
            <span>Attributes Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav("image_config")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeNav === "image_config"
                ? "bg-[#dfdfdf] dark:bg-[#494949] text-[#181818] dark:text-white shadow-xs"
                : "text-[#5e5e5e] dark:text-[#c6c6c6] hover:bg-[#e8e8e8] dark:hover:bg-[#2f2f2f]"
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>Image Path Config</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav("variants")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeNav === "variants"
                ? "bg-[#dfdfdf] dark:bg-[#494949] text-[#181818] dark:text-white shadow-xs"
                : "text-[#5e5e5e] dark:text-[#c6c6c6] hover:bg-[#e8e8e8] dark:hover:bg-[#2f2f2f]"
            }`}
          >
            <Layers size={15} />
            <span>Variant Templates</span>
          </button>
        </div>

        {/* User Card at bottom */}
        <div className="mt-auto border-t border-[#c7c7c7] dark:border-[#464646] pt-3 px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#e2e2e2] text-[#161616] font-bold text-xs flex items-center justify-center">
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#181818] dark:text-white truncate">
                {currentUser?.name || "System Admin"}
              </p>
              <p className="text-[10px] text-[#5e5e5e] dark:text-[#c6c6c6] truncate">
                {currentUser?.role || "ERP-001"}
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Canvas (Top Header + Active Sub-Module) ──────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-[#1b1b1b] h-14 border-b border-[#c7c7c7] dark:border-[#464646] flex items-center justify-between px-6 shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#181818] dark:text-white">
              Item Master Entry
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 bg-[#ededed] dark:bg-[#2f2f2f] text-[#373737] dark:text-[#c5c5c5] font-mono text-[11px] font-bold rounded">
              {products.length} Items Live
            </span>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 border border-[#c7c7c7] text-xs font-semibold hover:bg-[#eeeeee] rounded transition"
              >
                Close
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Workspace Canvas */}
        <main className="flex-1 overflow-hidden min-h-0 bg-[#fafafa] dark:bg-[#1c1c1c]">
          {activeNav === "item_details" && (
            <ItemDetailsGrid
              products={products}
              viewConfig={viewConfig}
              onRefreshProducts={handleRefresh}
              onNotification={handleNotify}
              onNavigateToItemViewConfig={() => setActiveNav("view_config")}
            />
          )}

          {activeNav === "view_config" && (
            <ItemViewConfig
              currentConfig={viewConfig}
              onSaveConfig={(cfg) => {
                setItemViewConfig(cfg);
                setActiveNav("item_details");
              }}
              onNotification={handleNotify}
            />
          )}

          {activeNav === "imports" && (
            <ItemMasterStudio
              onRefreshProducts={handleRefresh}
              onNotification={handleNotify}
              currentUser={currentUser}
              onCancel={() => setActiveNav("item_details")}
            />
          )}

          {activeNav === "attributes" && (
            <AttrMgmtStudio
              onNotification={handleNotify}
            />
          )}

          {activeNav === "image_config" && (
            <ImgPathStudio
              onNotification={handleNotify}
            />
          )}

          {activeNav === "variants" && (
            <div className="h-full overflow-y-auto p-4 custom-scrollbar">
              <VariantTplSec
                products={products}
                onRefreshProducts={handleRefresh}
                onNotification={handleNotify}
              />
            </div>
          )}
        </main>
      </div>

    </div>
  );
};

export default ItemMasterWs;
