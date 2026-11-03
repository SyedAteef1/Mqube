import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const pythonCoreTarget = process.env.PYTHON_CORE_HOST
  ? (process.env.PYTHON_CORE_HOST.startsWith("http")
      ? process.env.PYTHON_CORE_HOST
      : `http://${process.env.PYTHON_CORE_HOST}`)
  : (process.env.BACKEND_API_URL || "http://127.0.0.1:8000");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
    proxy: {
      "/api/v1": {
        target: pythonCoreTarget,
        changeOrigin: false,
        secure: false
      }
    }
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
    proxy: {
      "/api/v1": {
        target: pythonCoreTarget,
        changeOrigin: false,
        secure: false
      }
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("d3")) {
              return "vendor-charts";
            }
            if (id.includes("lucide-react") || id.includes("@material-symbols")) {
              return "vendor-icons";
            }
            if (id.includes("motion")) {
              return "vendor-motion";
            }
            if (id.includes("xlsx") || id.includes("jspdf") || id.includes("html2canvas")) {
              return "vendor-documents";
            }
            return "vendor-core";
          }

          if (id.includes("/src/components/")) {
            if (id.includes("SalesStudioTab")) return "tileflow-sales-studio";
            if (id.includes("PurchaseStudioTab")) return "tileflow-purchase-studio";
            if (id.includes("ReportDesignerTab")) return "tileflow-report-designer";
            if (id.includes("TermsEngineTab")) return "tileflow-terms-engine";
            if (id.includes("BarcodeStudioTab")) return "tileflow-barcode-studio";
            if (id.includes("PrintPreviewModal")) return "tileflow-print-preview";
            if (id.includes("DashboardTab")) return "tileflow-dashboard";
          }

          if (id.includes("/src/lib/")) return "app-lib";
          if (id.includes("/src/services/")) return "app-services";
          if (id.includes("/src/contexts/")) return "app-contexts";
        }
      }
    }
  }
});
