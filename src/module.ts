import { resolve } from 'node:path'
import { addImports, addImportsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

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

    addImports({
      name: 'defineState',
      from: resolver.resolve('./runtime/app/composables/defineState'),
    })

    // Unimport scans a plain directory at one level. The glob keeps Nuxt Kit's
    // official scanner while matching the recursive behavior of composables.
    addImportsDir(resolve(nuxt.options.srcDir, 'states/**'))
  },
})
