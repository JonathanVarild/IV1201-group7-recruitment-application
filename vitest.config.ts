import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/**',  // Exclude Playwright test directory
      '**/*.spec.ts', // Exclude Playwright test files
    ],
    passWithNoTests: true,
  },
})
