import { defineNuxtPlugin } from '#app'
import knownStates from '#build/nuxt-state/metadata'
import { inspectActiveStates, type StateInspectorEntry } from '../state-inspector'

interface InspectorRequest {
  result?: {
    active: StateInspectorEntry[]
    known: Array<{ name: string; source: string; origin: string }>
  }
}

export default defineNuxtPlugin({
  name: 'nuxt-state:devtools',
  setup(nuxtApp) {
    nuxtApp.hook(
      'nuxt-state:inspect' as never,
      ((request: InspectorRequest) => {
        request.result = {
          active: inspectActiveStates(nuxtApp),
          known: knownStates,
        }
      }) as never,
    )
  },
})
