import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--use-angle=gl'],
        },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'yarn serve:e2e',
    url: 'http://localhost:3000/test-page.html?playground=true',
    reuseExistingServer: !process.env.CI,
    timeout: 600 * 1000, // 10 minutes for model loading
    env: {
      // Set headers for WASM support
      NODE_OPTIONS: '--max-old-space-size=4096',
    },
  },
  expect: {
    timeout: parseInt(process.env.IMAGE_COMPARISON_TIMEOUT || '180') * 1000, // 3 minutes for image comparisons
  },
});
