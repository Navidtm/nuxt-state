import { fileURLToPath } from 'node:url'
import { loadNuxt } from '@nuxt/kit'
import { describe, expect, it } from 'vitest'
import NuxtState from '../../src/module'

describe('nuxt-state module', () => {
  it('appends defineState without replacing Nuxt keyed composables', async () => {
    const nuxt = await loadNuxt({
      cwd: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
      dev: true,
      overrides: {
        modules: [NuxtState],
      },
    })

    try {
      const keyedComposables = nuxt.options.optimization.keyedComposables
      const names = keyedComposables.map(({ name }) => name)

      expect(names).toContain('useState')
      expect(names).toContain('useFetch')
      expect(names).toContain('useAsyncData')

      const defineState = keyedComposables.find(({ name }) => name === 'defineState')
      expect(defineState).toMatchObject({
        argumentLength: 2,
      })
      expect(defineState?.source).toContain('/src/runtime/app/composables/defineState')
    } finally {
      await nuxt.close()
    }
  })
})
