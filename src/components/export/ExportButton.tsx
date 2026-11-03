import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  Table,
  FileText,
  ChevronDown,
  SlidersHorizontal,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  ExportColumnDefinition,
  ExportFormat,
  ExportScope,
} from "./types.ts";
import { ExportCenterModal } from "./ExportCenterModal.tsx";
import { GlobalExportService } from "../../services/globalExportService.ts";

export interface ExportButtonProps {
  moduleTitle: string;
  columns: ExportColumnDefinition[];
  data?: any[];
  selectedRows?: any[];
  totalRecordsCount?: number;
  filteredRecordsCount?: number;
  apiEndpoint?: string;
  appliedFilters?: Record<string, any>;
  searchTerm?: string;
  dateRange?: { start?: string; end?: string };
  companyName?: string;
  branchName?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  onNotification?: (title: string, message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  moduleTitle,
  columns = [],
  data = [],
  selectedRows = [],
  totalRecordsCount,
  filteredRecordsCount,
  apiEndpoint,
  appliedFilters = {},
  searchTerm = "",
  dateRange,
  companyName,
  branchName,
  variant = "outline",
  size = "sm",
  className = "",
  disabled = false,
  onNotification,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickExporting, setIsQuickExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleQuickExport = async (format: ExportFormat) => {
    setIsMenuOpen(false);
    setIsQuickExporting(true);

    try {
      const scope: ExportScope = selectedRows.length > 0 ? "selected" : "currentPage";
      const targetRows = selectedRows.length > 0 ? selectedRows : data;

      const result = await GlobalExportService.exportDataset({
        moduleName: moduleTitle,
        format,
        scope,
        columns: columns.filter((c) => c.isVisible !== false),
        data: targetRows,
        selectedRows,
        metadata: {
          moduleTitle,
          companyName,
          branchName,
          exportTimestamp: new Date().toLocaleString(),
          searchTerm: searchTerm || undefined,
          appliedFilters: Object.keys(appliedFilters).length > 0 ? appliedFilters : undefined,
          totalRecordsCount: targetRows.length,
          selectedRecordsCount: selectedRows.length,
        },
      });

      if (result.success) {
        onNotification?.(
          "Export Successful",
          `Exported ${result.rowCount} records to ${result.filename}`,
          "success"
        );
      } else {
        onNotification?.("Export Failed", result.errorMessage || "No records to export.", "error");
      }
    } catch (err: any) {
      onNotification?.("Export Failed", err?.message || "Failed to generate export.", "error");
    } finally {
      setIsQuickExporting(false);
    }
  };

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-2 text-xs gap-2",
    lg: "px-4 py-2.5 text-sm gap-2.5",
  }[size];

  const variantClasses = {
    primary: "bg-[#373737] hover:bg-[#2a2a2a] text-white border-transparent shadow-xs font-bold",
    secondary: "bg-[#e2e2e2] hover:bg-[#c7c7c7] dark:bg-[#2c2c2c] dark:hover:bg-[#393939] text-[#1c1c1c] dark:text-white border-transparent font-semibold",
    outline: "bg-white dark:bg-[#1c1c1c] hover:bg-[#f9f9f9] dark:hover:bg-[#262626] text-[#1c1c1c] dark:text-[#e2e2e2] border border-[#c7c7c7] dark:border-[#464646] shadow-2xs font-semibold",
    ghost: "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#5e5e5e] hover:text-[#1c1c1c] dark:text-[#c6c6c6] dark:hover:text-white border-transparent font-medium",
  }[variant];

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={menuRef}>
      <div className="inline-flex rounded-lg shadow-2xs overflow-hidden border border-[#c7c7c7] dark:border-[#464646]">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={disabled || isQuickExporting}
          className={`inline-flex items-center transition-colors ${sizeClasses} ${variantClasses} border-r border-[#c7c7c7]/50 dark:border-[#464646]/50 disabled:opacity-50 disabled:cursor-not-allowed`}
          title={`Export ${moduleTitle} data in Excel, CSV, or Text`}
        >
          {isQuickExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#373737] dark:text-[#c5c5c5]" />
          ) : (
            <Download className="w-3.5 h-3.5 text-[#373737] dark:text-[#c5c5c5]" />
          )}
          <span>Export</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          disabled={disabled || isQuickExporting}
          className="px-1.5 py-1.5 bg-white dark:bg-[#1c1c1c] hover:bg-[#f9f9f9] dark:hover:bg-[#262626] text-[#5e5e5e] dark:text-[#c6c6c6] transition-colors disabled:opacity-50"
          title="Quick Export Options"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isMenuOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Quick Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#222222] border border-[#c7c7c7] dark:border-[#464646] rounded-xl shadow-xl z-50 py-1.5 text-xs text-[#1c1c1c] dark:text-[#e2e2e2] animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-[#777777] dark:text-[#919191] border-b border-[#e2e2e2] dark:border-[#393939]">
            Quick Export ({selectedRows.length > 0 ? `${selectedRows.length} Selected` : `${data.length} Rows`})
          </div>

          <button
            type="button"
            onClick={() => handleQuickExport("xlsx")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f9f9f9] dark:hover:bg-[#2c2c2c] transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-medium block">Excel Spreadsheet (.xlsx)</span>
              <span className="text-[10px] text-[#777777] dark:text-[#919191]">Styled Workbook with Totals</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickExport("gsheet")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="font-bold block flex items-center gap-1">
                <span>Google Sheets</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 uppercase font-mono">Web</span>
              </span>
              <span className="text-[10px] text-[#777777] dark:text-[#919191]">Open live at sheets.new</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickExport("csv")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f9f9f9] dark:hover:bg-[#2c2c2c] transition-colors"
          >
            <Table className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="font-medium block">Comma-Separated (.csv)</span>
              <span className="text-[10px] text-[#777777] dark:text-[#919191]">Universal RFC 4180 Format</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickExport("json")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f9f9f9] dark:hover:bg-[#2c2c2c] transition-colors"
          >
            <Table className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <div>
              <span className="font-medium block">JSON Data (.json)</span>
              <span className="text-[10px] text-[#777777] dark:text-[#919191]">Structured Data Exchange</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickExport("txt")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f9f9f9] dark:hover:bg-[#2c2c2c] transition-colors"
          >
            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-medium block">Plain Text (.txt)</span>
              <span className="text-[10px] text-[#777777] dark:text-[#919191]">Aligned Monospace Table</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickExport("html")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#f9f9f9] dark:hover:bg-[#2c2c2c] transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <span className="font-medium block">HTML Report (.html)</span>
              <span className="text-[10px] text-[#777777] dark:text-[#919191]">Interactive Styled Document</span>
            </div>
          </button>

          <div className="my-1 border-t border-[#e2e2e2] dark:border-[#393939]" />

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              setIsModalOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#373737]/10 dark:hover:bg-[#373737]/25 text-[#373737] dark:text-[#c5c5c5] font-bold transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>Open Export Center...</span>
          </button>
        </div>
      )}

      {/* Advanced Export Center Modal */}
      <ExportCenterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        moduleTitle={moduleTitle}
        columns={columns}
        currentPageData={data}
        selectedRows={selectedRows}
        totalRecordsCount={totalRecordsCount}
        filteredRecordsCount={filteredRecordsCount}
        apiEndpoint={apiEndpoint}
        appliedFilters={appliedFilters}
        searchTerm={searchTerm}
        dateRange={dateRange}
        companyName={companyName}
        branchName={branchName}
        onNotification={onNotification}
      />
    </div>
  );
};
