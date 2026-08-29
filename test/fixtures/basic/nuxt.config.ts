import NuxtDefineState from '../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtDefineState],
  compatibilityDate: '2026-08-29',
  runtimeConfig: {
    public: {
      stateLabel: 'fixture-runtime-config',
    },
  },
})
