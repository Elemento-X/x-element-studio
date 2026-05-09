import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.tsx'],
    globals: true,
    css: true,
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/e2e', 'docs', 'src/docs'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: ['app/**'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'tests/e2e/**',
        '**/*.config.*',
        '**/*.d.ts',
        'src/docs/**',
        'docs/**',
        'public/**',
        '.claude/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
