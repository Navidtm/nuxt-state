import { useNuxtApp } from '#app'

type NotPromise<T> = T extends PromiseLike<unknown> ? never : unknown

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' && value !== null)
    || typeof value === 'function'
  ) && 'then' in value && typeof value.then === 'function'
}

/**
 * Turns a synchronous composable factory into state shared by one Nuxt app.
 */
export function defineState<T>(factory: () => T & NotPromise<T>): () => T {
  const instances = new WeakMap<object, T>()

  return function useDefinedState(): T {
    const nuxtApp = useNuxtApp()

    if (instances.has(nuxtApp)) {
      return instances.get(nuxtApp)!
    }

    const instance = factory()

    if (isPromiseLike(instance)) {
      throw new TypeError(
        '[nuxt-define-state] State factories must be synchronous. '
        + 'Expose an async function from the state or use Nuxt data-fetching composables instead.',
      )
    }

    instances.set(nuxtApp, instance)
    return instance
  }
}
