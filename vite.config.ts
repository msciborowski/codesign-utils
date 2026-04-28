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
      entry: './src/index.ts',
      name: 'CodesignUtils',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: Object.keys(dependencies ?? {}),
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
