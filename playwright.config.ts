import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.pw.ts", "**/*.spec.ts"],
  fullyParallel: true,
  reporter: "line",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    extraHTTPHeaders: { "x-salarysabi-e2e": "workspace-fixture" },
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1100 } } },
    { name: "mobile-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 500, height: 900 } } },
  ],
  webServer: {
    command: "npm run dev -- -p 3000",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
