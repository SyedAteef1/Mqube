import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  testIgnore: "golive.spec.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "report", open: "never" }]],
  outputDir: "results",
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1500, height: 950 },
    screenshot: "on",
    trace: "retain-on-failure",
  },
});
