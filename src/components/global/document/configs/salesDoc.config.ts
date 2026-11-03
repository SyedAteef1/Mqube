import { DocumentStudioConfig } from "../types.ts";

export const salesDocumentConfig: DocumentStudioConfig = {
  documentType: "SALES_INVOICE",
  title: "Sales Studio Document",
  subtitle: "Create retail tax invoices, sales orders, and B2C billing documents",
  partyType: "Customer",
  apiEndpoint: "/api/v1/sales/invoices",
  primaryActionLabel: "Post Sales Invoice",
  draftActionLabel: "Save Quotation Draft",
  showGstBreakdown: true,
  enableBatchTracking: true,
  enableSalesperson: true,
};
