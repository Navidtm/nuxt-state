import { fileURLToPath } from 'node:url'
import { getLayerDirectories, loadNuxt } from '@nuxt/kit'
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

  it('registers resolved app state directories for every Nuxt layer', async () => {
    const nuxt = await loadNuxt({
      cwd: fileURLToPath(new URL('../fixtures/layers', import.meta.url)),
      dev: true,
    })

    try {
      const layers = getLayerDirectories(nuxt)

      expect(layers[0]?.root).toBe(`${nuxt.options.rootDir}/`)
      expect(layers.map(({ root }) => root)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('/layers/2.high/'),
          expect.stringContaining('/layers/1.base/'),
          expect.stringContaining('/extended/'),
          expect.stringContaining('/packages/external-layer/'),
        ]),
      )

      const registeredDirs: string[] = []
      await nuxt.callHook('imports:dirs', registeredDirs)

      for (const layer of layers) {
        expect(registeredDirs).toContain(`${layer.app}states/**`)
      }
    } finally {
      await nuxt.close()
    }
  })

  it('registers a stable DevTools iframe and bridge only in development', async () => {
    const nuxt = await loadNuxt({
      cwd: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
      dev: true,
      overrides: { modules: [NuxtState], devtools: { enabled: true } },
    })

    try {
      const tabs: Array<Record<string, unknown>> = []
      await nuxt.callHook('devtools:customTabs', tabs as never)

      expect(tabs).toContainEqual(
        expect.objectContaining({
          name: 'nuxt-state',
          title: 'Nuxt State',
          view: { type: 'iframe', src: '/__nuxt_state_devtools__/' },
        }),
      )
      expect(nuxt.options.devServerHandlers).toEqual(
        expect.arrayContaining([expect.objectContaining({ route: '/__nuxt_state_devtools__/' })]),
      )
      expect(
        nuxt.options.plugins.map((plugin) => (typeof plugin === 'string' ? plugin : plugin.src)),
      ).toEqual(expect.arrayContaining([expect.stringContaining('/plugins/devtools.client')]))
    } finally {
      await nuxt.close()
    }
  })

  it.each([
    { label: 'disabled development', dev: true, devtools: { enabled: false } },
    { label: 'production', dev: false, devtools: { enabled: true } },
  ])('excludes DevTools integration in $label', async ({ dev, devtools }) => {
    const nuxt = await loadNuxt({
      cwd: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
      dev,
      overrides: { modules: [NuxtState], devtools },
    })

    try {
      const tabs: Array<Record<string, unknown>> = []
      await nuxt.callHook('devtools:customTabs', tabs as never)

      expect(tabs).not.toContainEqual(expect.objectContaining({ name: 'nuxt-state' }))
      expect(nuxt.options.devServerHandlers).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ route: '/__nuxt_state_devtools__/' })]),
      )
      expect(
        nuxt.options.plugins.map((plugin) => (typeof plugin === 'string' ? plugin : plugin.src)),
      ).not.toEqual(expect.arrayContaining([expect.stringContaining('/plugins/devtools.client')]))
    } finally {
      await nuxt.close()
    }
  })
})
