import { computed, reactive, readonly, ref, shallowReactive, shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import {
  classifyStateMember,
  inspectActiveStates,
  previewValue,
} from '../../src/runtime/app/state-inspector'
import {
  receiveStateSnapshots,
  registerHydratableState,
} from '../../src/runtime/app/state-registry'

function registerDebugState(
  nuxtApp: object,
  key: string,
  state: unknown,
  hydration: 'Hydrated' | 'Client-only' | 'Server' = 'Client-only',
): void {
  registerHydratableState(nuxtApp, key, {
    snapshot: vi.fn(),
    restore: vi.fn(),
    debug: { state, hydration },
  })
}

describe('development state inspector', () => {
  it('lists only active states without invoking lazy factories', () => {
    const nuxtApp = {}
    const lazyFactory = vi.fn()

    registerDebugState(nuxtApp, '$active', { count: ref(1) })

    expect(inspectActiveStates(nuxtApp)).toHaveLength(1)
    expect(lazyFactory).not.toHaveBeenCalled()
  })

  it('uses conservative public Vue member classifications', () => {
    const source = ref(1)

    expect(classifyStateMember(ref(1))).toBe('ref')
    expect(classifyStateMember(shallowRef({}))).toBe('shallowRef')
    expect(classifyStateMember(reactive({}))).toBe('reactive')
    expect(classifyStateMember(shallowReactive({}))).toBe('shallowReactive')
    expect(classifyStateMember(readonly({}))).toBe('readonly')
    expect(classifyStateMember(computed(() => source.value))).toBe('readonly ref')
    expect(classifyStateMember(() => undefined)).toBe('function')
    expect(classifyStateMember({})).toBe('other')
  })

  it('returns bounded safe previews for functions, cycles, and large values', () => {
    const cycle: { self?: unknown } = {}
    cycle.self = cycle
    const preview = previewValue({
      action: function increment() {},
      cycle,
      large: 'x'.repeat(2_000),
      many: Array.from({ length: 100 }, (_, index) => index),
      date: new Date('2026-01-02T03:04:05.000Z'),
      map: new Map([['a', 1]]),
      set: new Set(['a']),
    })
    const serialized = JSON.stringify(preview)

    expect(serialized).toContain('ƒ increment()')
    expect(serialized).toContain('"reference":"#')
    expect(serialized).toContain('"truncated":true')
    expect(serialized.length).toBeLessThan(8_000)
  })

  it('contains unusual member failures instead of crashing the application', () => {
    const nuxtApp = {}
    const unusual = Object.defineProperty({}, 'broken', {
      enumerable: true,
      get() {
        throw new Error('getter failed')
      },
    })
    registerDebugState(nuxtApp, '$unusual', unusual)

    expect(inspectActiveStates(nuxtApp)[0]?.members).toEqual([
      {
        name: 'broken',
        kind: 'unavailable',
        value: { unavailable: 'getter failed' },
      },
    ])
    expect(
      previewValue(
        new Proxy(
          {},
          {
            ownKeys() {
              throw new Error('proxy failed')
            },
          },
        ),
      ),
    ).toEqual({ unavailable: 'proxy failed' })
  })

  it('reflects current values on demand without watchers', () => {
    const nuxtApp = {}
    const count = ref(1)
    registerDebugState(nuxtApp, '$counter', { count })

    expect(inspectActiveStates(nuxtApp)[0]?.members[0]?.value).toBe(1)
    count.value = 2
    expect(inspectActiveStates(nuxtApp)[0]?.members[0]?.value).toBe(2)
  })

  it('replaces HMR entries instead of retaining stale state cards', () => {
    const nuxtApp = {}
    registerDebugState(nuxtApp, '$counter', { count: ref(1) })
    registerDebugState(nuxtApp, '$counter', { count: ref(2) })

    const inspected = inspectActiveStates(nuxtApp)
    expect(inspected).toHaveLength(1)
    expect(inspected[0]?.members[0]?.value).toBe(2)
  })

  it('reports hydrated and client-only states accurately', () => {
    const nuxtApp = {}
    receiveStateSnapshots(nuxtApp, { $hydrated: { count: 1 } })
    registerDebugState(nuxtApp, '$hydrated', { count: ref(1) })
    registerDebugState(nuxtApp, '$client', { count: ref(0) })

    expect(inspectActiveStates(nuxtApp).map(({ key, hydration }) => [key, hydration])).toEqual([
      ['$hydrated', 'Hydrated'],
      ['$client', 'Client-only'],
    ])
  })
})
