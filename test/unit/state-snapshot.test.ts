import { computed, reactive, readonly, ref } from 'vue'
import { describe, expect, it } from 'vitest'
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
