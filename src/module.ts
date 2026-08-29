import { resolve } from 'node:path'
import { addImports, addImportsDir, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'

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

    // Unimport scans a plain directory at one level. The glob keeps Nuxt Kit's
    // official scanner while matching the recursive behavior of composables.
    addImportsDir(resolve(nuxt.options.srcDir, 'states/**'))
  },
})
