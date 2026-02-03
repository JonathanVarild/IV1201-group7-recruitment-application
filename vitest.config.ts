import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/vitestSetup.tsx"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/acceptance-tests/**", // Exclude Playwright test directory
      "**/*.spec.ts", // Exclude Playwright test files
    ],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
