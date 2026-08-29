# Architecture

This document describes the released prototype baseline and the Nuxt 4.5.2 APIs selected
for the v0.1.0 hydration implementation.

## Baseline

The baseline inspected for v0.1.0 is commit `0cbf4f4` with package metadata at `0.0.2`.
The user-facing API is already intentionally small:

```ts
defineState(factory)
```

Each call to `defineState` creates a wrapper-local `WeakMap<NuxtApp, Instance>`. The
factory stays lazy, callers in one Nuxt app receive the exact same result, concurrent SSR
requests use different keys in the weak map, and old app instances remain garbage
collectable. Re-evaluating a state module creates a new wrapper and weak map, so HMR resets
state instead of preserving it.

The pre-hydration baseline passed install consistency, formatting, lint, type checking,
8 unit/integration tests, the module build, and the production playground build. The
published runtime output was approximately 1.02 kB and the complete module output was
approximately 2.13 kB. The playground build emitted one pre-existing duplicate-import
warning because it deliberately contains both a regular `useCounter` composable and a
state with the same export name.

## Nuxt 4.5.2 research

The installed Nuxt source and current Nuxt 4 module documentation agree on the following
behavior.

### Keyed composables

`nuxt.options.optimization.keyedComposables` is an array. Nuxt's defaults already contain
`useState`, `useFetch`, `useAsyncData`, their lazy variants, `callOnce`, and
`defineNuxtComponent`. A module must append its entry rather than replace this array.

The `defineState` entry needs:

```ts
{
  name: 'defineState',
  source: resolvedDefineStateRuntimePath,
  argumentLength: 2,
}
```

The source must be the same exact resolved runtime file used by the auto-import. Nuxt's
compiler matches imports by resolved source and injects a hash derived from the source file
and call position when fewer than `argumentLength` arguments are present. Therefore
developer code remains:

```ts
defineState(factory)
```

while transformed code is conceptually:

```ts
defineState(factory, '$generated-key')
```

The generated key format is a Nuxt implementation detail. `argumentLength: 2` is required
because the runtime can receive the factory plus one compiler-only key. Two calls in one
file receive different keys because the hash includes call position.

The v0.1.0 integration tests must still prove that module-provided auto-imports are visible
to this transform in both development and production builds. Explicit imports are only
transformable when their resolved source exactly matches the configured runtime file;
barrel re-exports are not followed by Nuxt's compiler.

### Hydration lifecycle

Nuxt's `useHydration(key, get, set)` is designed primarily for module plugins. Its current
implementation registers `get` on the server's `app:rendered` hook and `set` on the
client's `app:created` hook.

Nuxt applies runtime plugins before it calls `app:created`. On the client it calls
`app:created`, then `app:beforeMount`, and only then mounts and hydrates the Vue app. A tiny
runtime plugin can therefore register hydration early enough for component setup to see
the server snapshot. On the server, collecting at `app:rendered` captures mutations made
during rendering rather than the factory's initial values.

The module will use one internal payload property:

```text
nuxtApp.payload.__nuxt_state__
```

Nuxt 4.5.2's `NuxtPayload` has a string index signature, so a typed `useHydration` call can
use this custom property without replacing or augmenting `payload.state`, which belongs to
Nuxt's `useState` implementation.

## Selected v0.1.0 design

The existing wrapper-local weak map remains the instance owner. Hydration is layered on
top through a second internal `WeakMap<NuxtApp, Registry>`:

```text
defineState wrapper
  └─ WeakMap<NuxtApp, exact factory result>

runtime hydration plugin
  └─ WeakMap<NuxtApp, registry>
       ├─ active keyed instances
       └─ unconsumed client snapshots
```

The registry is neither injected nor exposed to application code. On the server, a used
state registers its keyed result and the plugin snapshots active entries once at
`app:rendered`. Unused state factories remain lazy and produce no payload entry. On the
client, the plugin receives the namespaced payload at `app:created`; when a keyed state is
created during component setup, the matching snapshot is immediately applied before the
factory result is returned.

Snapshots contain only supported mutable top-level members returned from the factory:

```ts
type StateSnapshot = Record<
  string,
  { type: 'ref'; value: unknown } | { type: 'reactive'; value: unknown }
>
```

Readonly computed refs and functions are not serialized. The client factory recreates
computed values, functions, watchers, and closures, after which restoration patches the
existing refs and reactive proxies. Nuxt's payload serializer remains responsible for
nested serializable values; this module does not introduce another serializer.

Client snapshots are consumed once. That detail prevents a hot-reloaded wrapper with the
same logical key from restoring the initial SSR snapshot and preserves the baseline HMR
reset behavior.

If no compiler key is supplied, the closure-local weak map still provides all v0 behavior.
Only cross-runtime hydration is unavailable; no unstable fallback key is generated.

## Open verification items

Implementation commits must prove:

- actual key injection for the module auto-import and distinct keys for two call sites;
- built-in Nuxt keyed-composable entries remain present;
- ref and reactive restoration occurs before Vue hydration;
- computed values and functions remain connected to restored state;
- concurrent SSR request payloads remain isolated;
- `useFetch` retains its own Nuxt payload behavior and does not refetch on hydration;
- production and development transforms both inject stable server/client keys;
- built declarations expose one public argument even though runtime JavaScript accepts the
  compiler-only key.
