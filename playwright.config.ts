import { defineConfig, devices } from "@playwright/test"

const MOCK_SUPABASE_PORT = 54329
const APP_PORT = 3100

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  timeout: 90_000,
  expect: {
    timeout: 20_000,
  },
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.CI ? undefined : "msedge",
      },
    },
  ],
  webServer: [
    {
      command: "node e2e/mock-supabase-server.mjs",
      url: `http://127.0.0.1:${MOCK_SUPABASE_PORT}/rest/v1/settings`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `npx next dev -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}/masuk`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_DIST_DIR: ".next-e2e",
        NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${MOCK_SUPABASE_PORT}`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key-test",
        SUPABASE_SERVICE_ROLE_KEY: "",
      },
    },
  ],
})
