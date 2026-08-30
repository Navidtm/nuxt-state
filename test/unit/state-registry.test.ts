import { describe, expect, it, vi } from 'vitest'
import {
  collectStateSnapshots,
  getStateRegistry,
  receiveStateSnapshots,
  registerHydratableState,
} from '../../src/runtime/app/state-registry'

describe('state hydration registry', () => {
  it('collects only active states for one Nuxt app', () => {
    const firstApp = {}
    const secondApp = {}

    registerHydratableState(firstApp, '$first', {
      snapshot: () => ({ count: 1 }),
      restore: vi.fn(),
    })
    registerHydratableState(secondApp, '$second', {
      snapshot: () => ({ count: 2 }),
      restore: vi.fn(),
    })

    expect(collectStateSnapshots(firstApp)).toEqual({ $first: { count: 1 } })
    expect(collectStateSnapshots(secondApp)).toEqual({ $second: { count: 2 } })
  })

  it('restores an active state when snapshots arrive', () => {
    const nuxtApp = {}
    const restore = vi.fn()

    registerHydratableState(nuxtApp, '$counter', {
      snapshot: vi.fn(),
      restore,
    })
    receiveStateSnapshots(nuxtApp, {
      $counter: { count: 41 },
    })

    expect(restore).toHaveBeenCalledOnce()
    expect(restore).toHaveBeenCalledWith({ count: 41 })
  })

  it('restores a lazy state registered after snapshots arrive', () => {
    const nuxtApp = {}
    const restore = vi.fn()

    receiveStateSnapshots(nuxtApp, {
      $counter: { count: 41 },
    })
    registerHydratableState(nuxtApp, '$counter', {
      snapshot: vi.fn(),
      restore,
    })

    expect(restore).toHaveBeenCalledWith({ count: 41 })
  })

  it('consumes a client snapshot only once so HMR wrappers reset', () => {
    const nuxtApp = {}
    const firstRestore = vi.fn()
    const hotRestore = vi.fn()
    const firstDispose = vi.fn()

    receiveStateSnapshots(nuxtApp, {
      $counter: { count: 41 },
    })
    registerHydratableState(nuxtApp, '$counter', {
      snapshot: vi.fn(),
      restore: firstRestore,
      dispose: firstDispose,
    })
    registerHydratableState(nuxtApp, '$counter', {
      snapshot: vi.fn(),
      restore: hotRestore,
    })

    expect(firstRestore).toHaveBeenCalledOnce()
    expect(hotRestore).not.toHaveBeenCalled()
    expect(firstDispose).toHaveBeenCalledOnce()
    expect(getStateRegistry(nuxtApp).active.size).toBe(1)
    expect(getStateRegistry(nuxtApp).hydration.size).toBe(0)
  })

  it('replaces rather than accumulates pending hydration payloads', () => {
    const nuxtApp = {}

    receiveStateSnapshots(nuxtApp, {
      $old: { count: 1 },
    })
    receiveStateSnapshots(nuxtApp, {
      $new: { count: 2 },
    })

    expect([...getStateRegistry(nuxtApp).hydration.keys()]).toEqual(['$new'])
  })
})
