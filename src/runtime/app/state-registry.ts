export type StateHydrationPayload = Record<string, unknown>

export interface HydratableStateEntry {
  snapshot: () => unknown
  restore: (snapshot: unknown) => void
  dispose?: () => void
  debug?: {
    state: unknown
    name?: string
    source?: string
    origin?: string
    hydration: 'Hydrated' | 'Client-only' | 'Server'
  }
}

interface StateRegistry {
  active: Map<string, HydratableStateEntry>
  hydration: Map<string, unknown>
}

const registries = new WeakMap<object, StateRegistry>()

export function getStateRegistry(nuxtApp: object): StateRegistry {
  let registry = registries.get(nuxtApp)

  if (!registry) {
    registry = {
      active: new Map(),
      hydration: new Map(),
    }
    registries.set(nuxtApp, registry)
  }

  return registry
}

export function registerHydratableState(
  nuxtApp: object,
  key: string,
  entry: HydratableStateEntry,
): void {
  const registry = getStateRegistry(nuxtApp)
  registry.active.get(key)?.dispose?.()
  registry.active.set(key, entry)

  if (registry.hydration.has(key)) {
    const snapshot = registry.hydration.get(key)
    registry.hydration.delete(key)
    entry.restore(snapshot)
  }
}

export function collectStateSnapshots(nuxtApp: object): StateHydrationPayload {
  const snapshots: StateHydrationPayload = {}

  for (const [key, entry] of getStateRegistry(nuxtApp).active) {
    snapshots[key] = entry.snapshot()
  }

  return snapshots
}

export function receiveStateSnapshots(
  nuxtApp: object,
  snapshots: StateHydrationPayload | undefined,
): void {
  const registry = getStateRegistry(nuxtApp)
  registry.hydration = new Map(Object.entries(snapshots ?? {}))

  for (const [key, entry] of registry.active) {
    if (!registry.hydration.has(key)) continue

    const snapshot = registry.hydration.get(key)
    registry.hydration.delete(key)
    entry.restore(snapshot)
  }
}

export function clearPendingStateSnapshots(nuxtApp: object): void {
  getStateRegistry(nuxtApp).hydration.clear()
}
