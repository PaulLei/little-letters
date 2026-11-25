import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: "http://127.0.0.1:4173",
    serviceWorkers: "block",
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] }
      : {},
  },
  webServer: {
    command: "npm run dev:ui -- --port 4173 --host 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://test-mailbox.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    },
  },
});
