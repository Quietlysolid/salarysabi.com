import { defineConfig } from "@playwright/test";
import base from "../playwright.config";

// Existing layout/fixture checks, explicitly directed to the isolated local staging app.
export default defineConfig({
  ...base,
  testDir: "../tests",
  outputDir: process.env.SALARYSABI_AUDIT_OUTPUT || "../test-results/staging-layout",
  workers: 1,
  expect: { timeout: 15000 },
  use: { ...base.use, baseURL: "http://localhost:3002", trace: "off" },
  webServer: undefined,
});
