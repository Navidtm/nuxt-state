import { resolve } from 'node:path'
import {
  addImports,
  addImportsDir,
  addPlugin,
  createResolver,
  defineNuxtModule,
  getLayerDirectories,
} from '@nuxt/kit'

export type ModuleOptions = Record<string, never>

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-state',
    compatibility: {
      nuxt: '^4.0.0',
    },
  },
  defaults: {},
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const defineStateSource = resolver.resolve('./runtime/app/composables/defineState')

    addImports({
      name: 'defineState',
      from: defineStateSource,
    })

    nuxt.options.optimization.keyedComposables.push({
      name: 'defineState',
      source: defineStateSource,
      argumentLength: 2,
    })

    addPlugin(resolver.resolve('./runtime/app/plugins/hydration'))

    // Nuxt assigns scanned imports their native layer priority from the source
    // path. Registering every resolved app directory therefore preserves the
    // project-first order returned by getLayerDirectories without custom aliases.
    addImportsDir(getLayerDirectories(nuxt).map((layer) => resolve(layer.app, 'states/**')))
  },
})
