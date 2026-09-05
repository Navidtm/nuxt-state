# Architecture

This document summarizes the implementation through v1.0.0. The stable public API is:

```ts
defineState(factory)
```

The payload format, generated hydration keys, registry, and snapshot machinery are internal
implementation details and are not public API.

## Instance ownership

Each `defineState` call owns a `WeakMap<NuxtApp, Instance>`. The factory runs lazily in a
detached Vue effect scope and its exact result is reused within that app. This provides SSR
request isolation while allowing discarded applications to be garbage-collected. The scope
stops when the app unmounts.

A second weak map holds per-app hydration records:

```text
defineState wrapper
  └─ WeakMap<NuxtApp, factory result>

hydration registry
  └─ WeakMap<NuxtApp, active entries and pending snapshots>
```

No process-global strong collection retains Nuxt apps or state. HMR creates a new wrapper,
stops the replaced scope, and resets the state.

## Hydration identity and lifecycle

The module appends `defineState` to Nuxt's keyed-composable configuration with an internal
second argument. Nuxt transforms the developer call into the conceptual form:

```ts
defineState(factory, '$nuxt-generated-key')
```

The resolved auto-import source must match the configured runtime source, so barrel re-exports
are not guaranteed to be transformed. If no key is injected, per-app sharing still works but
cross-runtime hydration does not.

The runtime plugin stores snapshots in:

```text
nuxtApp.payload.__nuxt_state__
```

On the server, snapshot callbacks run at `app:rendered`, capturing mutations made during SSR.
On the client, pending snapshots are received at `app:created`. When a state first runs, its
client object is created normally and matching values are restored before the result reaches
component setup and before Vue hydration.

Snapshots contain mutable enumerable top-level members:

```ts
type StateSnapshot = Record<
  string,
  { type: 'ref'; value: unknown } | { type: 'reactive'; value: unknown }
>
```

Readonly values, functions, and plain runtime members are recreated instead of serialized.
Matched snapshots are consumed immediately; unmatched initial snapshots are cleared after
mounting so HMR cannot replay the original server state.

## Restore behavior

Classification uses public Vue APIs. Standard and shallow refs/reactives are supported;
readonly values are skipped. Ref restoration assigns `.value`, while reactive roots are
patched without replacing the proxy.

The patcher handles arrays and plain objects recursively, deletes stale properties, and uses
a `WeakMap` to preserve shared references and terminate cycles. Revived `Date`, `Map`, `Set`,
and other Nuxt-serializable non-plain values are assigned rather than traversed. Nuxt remains
the only serializer.

Writable computed refs look like mutable refs through Vue's public APIs. Restoring one invokes
its setter and may cause side effects; return its mutable source refs instead. Direct primitive,
function, ref, or reactive-root factory results may be shared, but are not supported hydration
shapes because snapshots are member-based.

## Nuxt composables

The app-lived effect scope prevents state effects and Nuxt data refs from being disposed with
the first consuming component. Tests cover plugins, middleware, layouts, navigation,
mount/unmount, cookies, runtime config, routing, `callOnce`, `useFetch`, and `useAsyncData`.
Normal Nuxt context requirements still apply.

The module never reads or writes `nuxtApp.payload.data` or `payload.state`. Nuxt therefore owns
request keys, deduplication, hydration, status, and refresh behavior. In the payload-efficiency
fixture, a recognizable 16 KiB response was reachable from both Nuxt data and the state snapshot,
but serialized once as a shared graph value:

| Measurement   | Direct `useFetch` | In `defineState` | Difference |
| ------------- | ----------------: | ---------------: | ---------: |
| JSON payload  |          16,706 B |         16,761 B |      +55 B |
| Complete HTML |          17,844 B |         17,975 B |     +131 B |

These fixture-specific numbers demonstrate metadata overhead, not a duplicated response body.

## Private reactive state

The scanner only sees values returned by the factory. If a private ref is mutated during SSR
but only a computed view is returned, the server can render the mutated value while the client
recreates the ref at its default, causing a hydration mismatch.

Reactive state that must survive SSR hydration therefore needs to be exposed from the
`defineState` factory. Supporting closure-private state would require a new explicit API,
compiler rewriting, or undocumented Vue internals; none is used.

## Nuxt Layers

The module uses the public `getLayerDirectories(nuxt)` API and registers
`resolve(layer.app, 'states/**')` for every resolved layer. This respects custom app directories
and Nuxt's native project-first import priority without accessing `nuxt.options._layers` or
creating aliases.

Layer location does not affect runtime ownership: instances and hydration records remain keyed
by the current `NuxtApp`. Tests cover local, explicit, package, nested, collision, hydration,
concurrency, and HMR cases.

## DevTools

The v0.3 integration uses the stable Nuxt DevTools 3 iframe API. In development, the module
registers a read-only tab and an app hook that queries the existing per-app registry. It adds no
public state endpoint, websocket, global registry, or eager factory execution.

Active entries show hydration status and bounded member previews. Static auto-import metadata
separately lists export names, source paths, and layer origins. Nuxt exposes no stable mapping
between generated runtime keys and static exports, so active entries use the internal key as a
fallback label.

Preview generation limits depth, item count, node count, and string length; represents cycles,
shared references, collections, and functions safely; and contains getter/proxy errors. The view
polls at most once per second while visible and installs no deep watcher.

All registration, UI, metadata, inspector imports, and debug references are gated by development
mode. Production builds contain no DevTools route, polling, bridge, or inspector code.

## Deliberate constraints

- Nuxt 4, Vue 3, synchronous factories, and serializable payload values only.
- Hydration supports enumerable returned mutable refs/reactives, including shallow variants.
- Private mutable state, `customRef`, and writable computed hydration are unsupported.
- Missing compiler keys preserve sharing but cannot hydrate.
- No persistence, reset API, keyed instances, or HMR preservation.
- DevTools is read-only and development-only.

The test suite verifies keyed transformation, pre-mount restoration, request isolation,
graph-aware restoration, Nuxt composable behavior, browser hydration, Layers, DevTools safety,
production exclusion, and public one-argument declarations.
