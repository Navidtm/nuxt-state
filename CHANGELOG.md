# Changelog

## 0.3.0

- Discover `app/states/` across resolved Nuxt Layers with the official
  `getLayerDirectories()` API, including local auto-layers, explicit `extends`, package layers,
  nested states, SSR hydration, request isolation, and native priority collisions.
- Add a development-only, read-only Nuxt DevTools iframe for active instances, hydration status,
  internal keys, conservative Vue member kinds, and bounded cycle-safe value previews.
- Show statically known state export names, project-relative sources, and layer origins separately
  from lazy active instances; opening DevTools never executes factories.
- Keep DevTools registration, view serving, polling, bridge, and inspector code out of production;
  use stable Nuxt DevTools 3.4 without nightly or alpha overrides.
- Characterize writable computed hydration in Chromium: it enters the snapshot as a mutable ref,
  source refs restore first in the tested return order, and its setter runs exactly once with
  already-restored values. It remains unsupported because Vue has no public computed detector and
  setters may have side effects.

The public API remains exactly `defineState(factory)`. HMR still resets state, DevTools cannot
mutate state, and no public IDs, options, persistence, reset, patch, or subscription APIs were
added.

## 0.2.0

- Run each state factory in a detached, app-lived Vue effect scope so watchers, route state, and
  Nuxt data composables are not tied to the first consuming component.
- Officially support SSR hydration of `shallowRef()` and `shallowReactive()` while preserving
  their shallow behavior.
- Make reactive graph restoration cycle-safe and preserve shared references, arrays, deleted
  properties, `Date`, `Map`, and `Set` values through Nuxt's payload serializer.
- Clear consumed snapshots immediately, clear unmatched initial snapshots after `app:mounted`,
  stop effect scopes at Vue app unmount, and dispose replaced HMR entries.
- Add compatibility coverage for `useAsyncData`, `callOnce`, `useCookie`, `useRuntimeConfig`,
  `useRoute`, `useRouter`, plugins, middleware, layouts, navigation, repeated mount/unmount, and
  client-lazy state.
- Add deterministic 50-request CI isolation coverage and an optional 200-request release stress
  test.
- Make `test:types` self-contained on clean CI checkouts by preparing Nuxt-generated types first.

Writable computed refs remain unsupported hydration state: Vue's public introspection identifies
them as writable refs, so restoration invokes their setter. Return their mutable source refs and
treat the computed as derived runtime state instead. Closure-private state and unusual non-object
factory return shapes remain outside the hydration contract.

## 0.1.0

- Add transparent SSR hydration for mutable top-level `ref()` and `reactive()` members.
- Use Nuxt's native keyed-composable transform while keeping the public API exactly
  `defineState(factory)`.
- Restore snapshots before Vue hydration so computed values and functions remain connected to
  the client-created refs and reactive proxies.
- Preserve per-Nuxt-app/request isolation, lazy factories, exact return identity, and HMR reset
  behavior.
- Add real Chromium coverage for production and development hydration, mismatch detection,
  reactive updates, concurrent SSR requests, and `useFetch()` coexistence.

The internal payload and snapshot formats are not public API and may change before 1.0.
Mutable state must be returned from the factory to participate in SSR hydration. Nuxt data
composable values can appear in the internal snapshot metadata, but Nuxt's graph serializer
shares the underlying response object rather than serializing its body twice.
