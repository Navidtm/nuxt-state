import { useNuxtApp } from '#app'
import { effectScope } from 'vue'
import { registerHydratableState } from '../state-registry'
import { restoreState, snapshotState } from '../state-snapshot'

type NotPromise<T> = T extends PromiseLike<unknown> ? never : unknown

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    ((typeof value === 'object' && value !== null) || typeof value === 'function') &&
    'then' in value &&
    typeof value.then === 'function'
  )
}

/**
 * Turns a synchronous composable factory into state shared by one Nuxt app.
 */
export function defineState<T>(factory: () => T & NotPromise<T>): () => T
export function defineState<T>(factory: () => T & NotPromise<T>, internalKey?: string): () => T {
  const instances = new WeakMap<object, T>()

  return function useDefinedState(): T {
    const nuxtApp = useNuxtApp()

    if (instances.has(nuxtApp)) {
      return instances.get(nuxtApp)!
    }

    const scope = effectScope(true)
    let instance: T

    try {
      instance = scope.run(factory)!
    } catch (error) {
      scope.stop()
      throw error
    }

    if (isPromiseLike(instance)) {
      scope.stop()
      throw new TypeError(
        '[nuxt-state] State factories must be synchronous. ' +
          'Expose an async function from the state or use Nuxt data-fetching composables instead.',
      )
    }

    instances.set(nuxtApp, instance)

    const app = nuxtApp as { vueApp?: { onUnmount?: (cleanup: () => void) => void } }
    app.vueApp?.onUnmount?.(() => scope.stop())

    if (internalKey) {
      registerHydratableState(nuxtApp, internalKey, {
        snapshot: () => snapshotState(instance),
        restore: (snapshot) => restoreState(instance, snapshot),
        dispose: () => scope.stop(),
        debug: import.meta.dev
          ? {
              state: instance,
              hydration: import.meta.server ? 'Server' : 'Client-only',
            }
          : undefined,
      })
    }

    return instance
  }
}
