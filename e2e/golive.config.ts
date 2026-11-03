import { defineConfig } from "@playwright/test";

// Rehearsal of the first day on a fresh production install (run against the production build).
export default defineConfig({
  testDir: ".",
  testMatch: "golive.spec.ts",
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  outputDir: "results-golive",
  use: {
    baseURL: process.env.GOLIVE_URL || "http://localhost:4100",
    viewport: { width: 1500, height: 950 },
    headless: false,
    screenshot: "on",
    trace: "retain-on-failure",
  },
});
