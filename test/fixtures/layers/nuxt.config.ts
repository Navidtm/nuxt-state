import NuxtState from '../../../src/module'

export default defineNuxtConfig({
  extends: ['./extended', 'nuxt-state-fixture-layer'],
  modules: [NuxtState],
  compatibilityDate: '2026-08-29',
  vite: {
    server: {
      hmr: { port: 24679 },
    },
  },
})
