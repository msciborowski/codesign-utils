import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      // Entry barrels only re-export; v8 records no executable statements for them and reports 0%.
      exclude: ['src/**/*.d.ts', 'src/**/index.ts', 'src/maidenhead.ts'],
      thresholds: {
        100: true,
      },
    },
  },
})
