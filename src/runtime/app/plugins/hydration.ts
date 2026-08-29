import { defineNuxtPlugin, useHydration } from '#app'
import {
  collectStateSnapshots,
  receiveStateSnapshots,
  type StateHydrationPayload,
} from '../state-registry'

export const STATE_PAYLOAD_KEY = '__nuxt_state__' as const

export default defineNuxtPlugin((nuxtApp) => {
  useHydration<typeof STATE_PAYLOAD_KEY, StateHydrationPayload | undefined>(
    STATE_PAYLOAD_KEY,
    () => collectStateSnapshots(nuxtApp),
    (snapshots) => receiveStateSnapshots(nuxtApp, snapshots),
  )
})
