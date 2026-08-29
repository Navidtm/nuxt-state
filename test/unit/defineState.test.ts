import { computed, getCurrentScope, reactive, ref, watchEffect } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineState } from '../../src/runtime/app/composables/defineState'
import { collectStateSnapshots, receiveStateSnapshots } from '../../src/runtime/app/state-registry'
import { setCurrentNuxtApp } from './nuxt-app-mock'

const defineStateInternal = defineState as unknown as <T>(
  factory: () => T,
  internalKey?: string,
) => () => T

describe('defineState', () => {
  beforeEach(() => setCurrentNuxtApp({}))

  it('is lazy and invokes its factory once per Nuxt app', () => {
    const factory = vi.fn(() => ({ value: ref(0) }))
    const useExample = defineState(factory)

    expect(factory).not.toHaveBeenCalled()
    useExample()
    useExample()

    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('returns the exact same object to every caller in one app', () => {
    const useExample = defineState(() => ({ value: ref(0) }))

    expect(useExample()).toBe(useExample())
  })

  it('runs factories in an app-lived detached Vue effect scope', () => {
    const source = ref(0)
    const observed = vi.fn()
    const useExample = defineState(() => {
      const scope = getCurrentScope()
      watchEffect(() => observed(source.value), { flush: 'sync' })
      return { scope }
    })

    const state = useExample()
    source.value++

    expect(state.scope?.detached).toBe(true)
    expect(observed).toHaveBeenLastCalledWith(1)
  })

  it('creates isolated objects for different Nuxt apps', () => {
    const useExample = defineState(() => ({ value: ref(0) }))
    const firstApp = {}
    const secondApp = {}

    setCurrentNuxtApp(firstApp)
    const first = useExample()
    first.value.value = 42

    setCurrentNuxtApp(secondApp)
    const second = useExample()

    expect(second).not.toBe(first)
    expect(second.value.value).toBe(0)

    setCurrentNuxtApp(firstApp)
    expect(useExample()).toBe(first)
    expect(useExample().value.value).toBe(42)
  })

  it('preserves standard ref, reactive, computed, and function behavior', () => {
    const useCounter = defineState(() => {
      const count = ref(1)
      const profile = reactive({ name: 'Guest' })
      const double = computed(() => count.value * 2)
      const increment = (amount = 1) => (count.value += amount)

      return { count, profile, double, increment }
    })

    const first = useCounter()
    const second = useCounter()
    first.count.value++
    second.profile.name = 'Nuxt User'
    second.increment(3)

    expect(first.count.value).toBe(5)
    expect(first.double.value).toBe(10)
    expect(first.profile.name).toBe('Nuxt User')
  })

  it('keeps multiple defineState closures independent', () => {
    const useFirst = defineState(() => ({ value: ref('first') }))
    const useSecond = defineState(() => ({ value: ref('second') }))

    expect(useFirst()).not.toBe(useSecond())
    useFirst().value.value = 'changed'
    expect(useSecond().value.value).toBe('second')
  })

  it('collects final state at render time instead of factory defaults', () => {
    const nuxtApp = {}
    setCurrentNuxtApp(nuxtApp)
    const useCounter = defineStateInternal(() => ({ count: ref(0) }), '$counter')

    useCounter().count.value = 41

    expect(collectStateSnapshots(nuxtApp)).toEqual({
      $counter: {
        count: { type: 'ref', value: 41 },
      },
    })
  })

  it('restores a compiler-keyed state before returning it', () => {
    const nuxtApp = {}
    setCurrentNuxtApp(nuxtApp)
    receiveStateSnapshots(nuxtApp, {
      $counter: {
        count: { type: 'ref', value: 41 },
      },
    })
    const useCounter = defineStateInternal(() => {
      const count = ref(0)
      const double = computed(() => count.value * 2)
      const increment = () => count.value++
      return { count, double, increment }
    }, '$counter')

    const state = useCounter()

    expect(state.count.value).toBe(41)
    expect(state.double.value).toBe(82)
    state.increment()
    expect(state.double.value).toBe(84)
  })

  it('rejects async factories at runtime for JavaScript callers', async () => {
    const useAsyncState = defineState((async () => ({ value: 1 })) as never)

    expect(() => useAsyncState()).toThrowError('[nuxt-state] State factories must be synchronous.')
  })
})
