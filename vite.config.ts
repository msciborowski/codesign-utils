/// <reference types="vitest" />

import dts from 'vite-plugin-dts'
import { defineConfig } from 'vite'
import { dependencies } from './package.json'

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts'],
    }),
  ],
  build: {
    lib: {
      // `index` is the full package; `maidenhead` is a dependency-free subset for consumers
      // that need locator arithmetic without pulling in turf (see src/maidenhead.ts); `qso-log` reads
      // QSO log files (see src/qso-log.ts).
      entry: {
        index: './src/index.ts',
        maidenhead: './src/maidenhead.ts',
        'qso-log': './src/qso-log.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: Object.keys(dependencies ?? {}),
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
