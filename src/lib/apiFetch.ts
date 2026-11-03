import { apiFetchV1 } from "./apiFetchV1.js";
export { apiFetchV1 } from "./apiFetchV1.js";

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const normalizedEndpoint = endpoint.startsWith("/api/v1") 
    ? endpoint.replace(/^\/api\/v1/, "") 
    : endpoint.startsWith("/api") 
    ? endpoint.replace(/^\/api/, "") 
    : endpoint;

  return apiFetchV1(normalizedEndpoint, options);
}

/**
 * Record UI-driven audit actions (views, prints, exports) to system logs via FastAPI
 */
export async function recordAuditAction(actionType: string, tableName: string, recordId: string, reason: string): Promise<void> {
  try {
    await apiFetchV1("/audit-logs", {
      method: "POST",
      body: JSON.stringify({ actionType, tableName, recordId, reason })
    });
  } catch (err) {
    console.error("[Audit Logger] Failed to record audit action:", err);
  }
}
