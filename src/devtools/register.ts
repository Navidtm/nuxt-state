import type { Nuxt } from '@nuxt/schema'
import { addCustomTab } from '@nuxt/devtools-kit'

/** Stable Nuxt DevTools v3 adapter. The v4 dock API is still alpha-only. */
export function registerDevtools(route: string, nuxt: Nuxt): void {
  addCustomTab(
    {
      name: 'nuxt-state',
      title: 'Nuxt State',
      icon: 'carbon:data-vis-4',
      category: 'app',
      view: {
        type: 'iframe',
        src: route,
      },
    },
    nuxt,
  )
}
