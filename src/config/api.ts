/**
 * Resolves the target base URL for the FastAPI backend service.
 * 
 * In Docker Compose (dev/preview): Uses relative /api/v1 path which is proxied to tileflow-api:8000 by Vite.
 * Locally (dev): Uses relative /api/v1 path which is proxied to localhost:8000 by Vite.
 * Production: Should be configured via FASTAPI_BASE_URL env var.
 * 
 * The browser cannot access server-side DATABASE_URL, so we use relative paths
 * that rely on the Vite proxy configured in vite.config.ts.
 */
export const FASTAPI_BASE_URL: string =
  process.env.FASTAPI_BASE_URL ||
  "/api/v1";
