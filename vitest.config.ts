import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#app': fileURLToPath(new URL('./test/unit/nuxt-app-mock.ts', import.meta.url)),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/types/**', 'test/stress/**'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
})
