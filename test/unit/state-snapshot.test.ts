import { computed, isReactive, reactive, readonly, ref, shallowReactive, shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { restoreState, snapshotState } from '../../src/runtime/app/state-snapshot'

describe('state snapshots', () => {
  it('captures mutable refs and reactive objects without runtime-only members', () => {
    const count = ref(10)
    const user = reactive({
      profile: { name: 'Nuxt', settings: { darkMode: true } },
      roles: ['admin', 'developer'],
    })
    const double = computed(() => count.value * 2)
    const increment = () => count.value++

    expect(snapshotState({ count, user, double, increment, plain: { value: 1 } })).toEqual({
      count: { type: 'ref', value: 10 },
      user: {
        type: 'reactive',
        value: {
          profile: { name: 'Nuxt', settings: { darkMode: true } },
          roles: ['admin', 'developer'],
        },
      },
    })
  })

  it('skips readonly refs and readonly reactive objects', () => {
    const source = ref(1)

    expect(
      snapshotState({
        computed: computed(() => source.value * 2),
        readonly: readonly({ value: 1 }),
      }),
    ).toEqual({})
  })

  it('hydrates a mutable source once and lets its returned readonly view update', () => {
    const count = ref(0)
    const publicCount = readonly(count)
    const state = { count, publicCount }

    expect(snapshotState(state)).toEqual({
      count: { type: 'ref', value: 0 },
    })

    restoreState(state, {
      count: { type: 'ref', value: 41 },
      publicCount: { type: 'ref', value: 99 },
    })

    expect(count.value).toBe(41)
    expect(publicCount.value).toBe(41)
  })

  it('characterizes writable computed refs as mutable through public Vue introspection', () => {
    const firstName = ref('Client')
    const lastName = ref('Initial')
    const setter = vi.fn((value: string) => {
      const [first = '', last = ''] = value.split(' ')
      firstName.value = first
      lastName.value = last
    })
    const fullName = computed({
      get: () => `${firstName.value} ${lastName.value}`,
      set: setter,
    })

    expect(snapshotState({ fullName })).toEqual({
      fullName: { type: 'ref', value: 'Client Initial' },
    })

    restoreState(
      { fullName },
      {
        fullName: { type: 'ref', value: 'Server User' },
      },
    )

    expect(setter).toHaveBeenCalledWith('Server User')
    expect(firstName.value).toBe('Server')
    expect(lastName.value).toBe('User')
  })

  it('restores refs while preserving their runtime identity', () => {
    const data = ref({ items: [{ id: 0, name: 'Initial' }] })
    const state = { data }

    restoreState(state, {
      data: {
        type: 'ref',
        value: {
          items: [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
          ],
        },
      },
    })

    expect(state.data).toBe(data)
    expect(data.value.items).toEqual([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ])
  })

  it('restores shallowRef values without introducing deep reactivity', () => {
    const catalog = shallowRef({ version: 1, items: [{ id: 1, name: 'Initial' }] })
    const originalRef = catalog

    restoreState(
      { catalog },
      {
        catalog: {
          type: 'ref',
          value: { version: 2, items: [{ id: 2, name: 'Server' }] },
        },
      },
    )

    expect(catalog).toBe(originalRef)
    expect(catalog.value).toEqual({ version: 2, items: [{ id: 2, name: 'Server' }] })
    expect(isReactive(catalog.value)).toBe(false)
    expect(isReactive(catalog.value.items)).toBe(false)
  })

  it('patches shallowReactive roots without making nested objects reactive', () => {
    const state = shallowReactive({
      user: null as null | string,
      metadata: { version: 1, obsolete: true },
    })
    const originalProxy = state
    const originalMetadata = state.metadata

    restoreState(
      { state },
      {
        state: {
          type: 'reactive',
          value: { user: 'Server User', metadata: { version: 2 } },
        },
      },
    )

    expect(state).toBe(originalProxy)
    expect(state.metadata).toBe(originalMetadata)
    expect(state).toEqual({ user: 'Server User', metadata: { version: 2 } })
    expect(isReactive(state)).toBe(true)
    expect(isReactive(state.metadata)).toBe(false)
  })

  it('deeply patches reactive state while preserving existing object identities', () => {
    const user = reactive({
      profile: { name: 'Initial', settings: { darkMode: false } },
      roles: ['guest'],
      obsolete: true,
    })
    const profile = user.profile
    const settings = user.profile.settings
    const roles = user.roles

    restoreState(
      { user },
      {
        user: {
          type: 'reactive',
          value: {
            profile: { name: 'Server User', settings: { darkMode: true } },
            roles: ['admin', 'developer'],
          },
        },
      },
    )

    expect(user.profile).toBe(profile)
    expect(user.profile.settings).toBe(settings)
    expect(user.roles).toBe(roles)
    expect(user).toEqual({
      profile: { name: 'Server User', settings: { darkMode: true } },
      roles: ['admin', 'developer'],
    })
  })

  it('handles array growth, shrinkage, replacement, null, undefined, and deletion', () => {
    const state = reactive({
      growing: [1],
      shrinking: [1, 2, 3],
      replaced: { old: true } as null | { old: boolean },
      optional: 'client' as string | undefined,
      obsolete: true,
    })

    restoreState(
      { state },
      {
        state: {
          type: 'reactive',
          value: {
            growing: [1, 2, 3],
            shrinking: [9],
            replaced: null,
            optional: undefined,
          },
        },
      },
    )

    expect(state).toEqual({
      growing: [1, 2, 3],
      shrinking: [9],
      replaced: null,
      optional: undefined,
    })
    expect('obsolete' in state).toBe(false)
  })

  it('preserves Date, Map, and Set values through restoration', () => {
    const state = reactive({
      createdAt: new Date('2000-01-01T00:00:00.000Z'),
      tags: new Set(['client']),
      values: new Map([['client', 0]]),
    })
    const serverValues = {
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      tags: new Set(['a', 'b']),
      values: new Map([
        ['a', 1],
        ['b', 2],
      ]),
    }

    restoreState(
      { state },
      {
        state: { type: 'reactive', value: serverValues },
      },
    )

    expect(state.createdAt).toBeInstanceOf(Date)
    expect(state.createdAt.toISOString()).toBe('2026-01-02T03:04:05.000Z')
    expect([...state.tags]).toEqual(['a', 'b'])
    expect([...state.values]).toEqual([
      ['a', 1],
      ['b', 2],
    ])
  })

  it('preserves shared references from the server graph', () => {
    const state = reactive({
      a: { value: 0 },
      b: { value: 0 },
    })
    const shared = { value: 41 }

    restoreState(
      { state },
      {
        state: { type: 'reactive', value: { a: shared, b: shared } },
      },
    )

    expect(state.a.value).toBe(41)
    expect(state.a).toBe(state.b)
  })

  it('restores cyclic objects without recursion overflow', () => {
    interface CyclicValue {
      value: string
      self?: CyclicValue
    }

    const clientCycle: CyclicValue = { value: 'client' }
    clientCycle.self = clientCycle
    const state = reactive({ cycle: clientCycle })
    const serverCycle: CyclicValue = { value: 'server' }
    serverCycle.self = serverCycle

    restoreState(
      { state },
      {
        state: { type: 'reactive', value: { cycle: serverCycle } },
      },
    )

    expect(state.cycle.value).toBe('server')
    expect(state.cycle.self).toBe(state.cycle)
  })

  it('keeps computed values and functions connected to hydrated state', () => {
    const count = ref(0)
    const double = computed(() => count.value * 2)
    const increment = () => count.value++
    const state = { count, double, increment }

    restoreState(state, {
      count: { type: 'ref', value: 41 },
    })

    expect(state.double.value).toBe(82)
    state.increment()
    expect(state.count.value).toBe(42)
    expect(state.double.value).toBe(84)
  })

  it('recomputes a chain of readonly computed refs from hydrated state', () => {
    const a = ref(1)
    const b = computed(() => a.value + 1)
    const c = computed(() => b.value + 1)

    restoreState(
      { a, b, c },
      {
        a: { type: 'ref', value: 40 },
      },
    )

    expect(b.value).toBe(41)
    expect(c.value).toBe(42)
    expect(snapshotState({ a, b, c })).toEqual({
      a: { type: 'ref', value: 40 },
    })
  })

  it('preserves Vue nested-ref behavior inside reactive and ref state', () => {
    const current = ref(1)
    const reactiveState = reactive({ current })
    const refState = ref({ nested: { value: 1 } })

    restoreState(
      { reactiveState, refState },
      {
        reactiveState: { type: 'reactive', value: { current: 5 } },
        refState: { type: 'ref', value: { nested: { value: 6 } } },
      },
    )

    expect(reactiveState.current).toBe(5)
    expect(current.value).toBe(5)
    expect(refState.value.nested.value).toBe(6)
  })

  it('characterizes non-composable return shapes as non-hydratable', () => {
    expect(snapshotState(ref(1))).toEqual({})
    expect(snapshotState(reactive({ count: 1 }))).toEqual({})
    expect(snapshotState(() => undefined)).toEqual({})
  })

  it('ignores malformed or incompatible snapshot entries', () => {
    const count = ref(1)
    const user = reactive({ name: 'Initial' })

    restoreState(
      { count, user },
      {
        count: { type: 'reactive', value: { invalid: true } },
        user: { type: 'unknown', value: { name: 'Invalid' } },
        missing: { type: 'ref', value: 2 },
      },
    )

    expect(count.value).toBe(1)
    expect(user.name).toBe('Initial')
  })
})
