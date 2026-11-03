import { DocumentStudioConfig } from "../types.ts";

export const purchaseDocumentConfig: DocumentStudioConfig = {
  documentType: "PURCHASE_ORDER",
  title: "Purchase Order & Inward Studio",
  subtitle: "Vendor procurement orders, inward goods receipt notes (GRN), and batch receipt",
  partyType: "Supplier",
  apiEndpoint: "/api/v1/purchase/orders/",
  primaryActionLabel: "Post Purchase Order",
  draftActionLabel: "Save Purchase Draft",
  showGstBreakdown: true,
  enableBatchTracking: true,
  enableSalesperson: false,
};
