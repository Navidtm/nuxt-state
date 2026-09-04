# nuxt-state

> Define shared Nuxt state with the Vue Composition API.

`nuxt-state` is an experimental Nuxt 4 module. A composable created with
`defineState` runs lazily once per Nuxt application and returns the same result to every
caller in that app.

It sits between a simple `useState()` value and a full state-management library such as
Pinia. There are no stores, IDs, actions, getters, or special wrappers—only standard Vue
primitives.

## Install

```bash
pnpm add nuxt-state
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-state'],
})
```

## Usage

Create states in `app/states/`:

```ts
// app/states/counter.ts
export const useCounter = defineState(() => {
  const count = ref(0)
  const double = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, double, increment }
})
```

Exports from this directory, including nested directories and multiple exports per file,
are auto-imported. `defineState` is also auto-imported and may be used elsewhere.

```vue
<script setup lang="ts">
const { count, double, increment } = useCounter()

increment()
console.log(double.value)
</script>
```

All callers within one Nuxt app receive the exact factory result. Refs, reactive objects,
computed refs, and functions retain their normal Vue behavior. Server requests and separate
client apps never share instances.

## Nuxt Layers

States in the resolved `app/states/` directory of local, extended, or package-provided
[Nuxt Layers](https://nuxt.com/docs/4.x/guide/going-further/layers) are auto-imported too.
Normal Nuxt priority applies: project exports override layer exports, and higher-priority
layers override lower-priority ones.

## DevTools

With Nuxt DevTools enabled, a development-only **Nuxt State** tab provides read-only views
of active states and discovered state exports. It shows hydration status, safe bounded value
previews, source paths, and layer origins without executing lazy factories.

The inspector cannot mutate state or invoke functions. It polls only while visible, adds no
production runtime code, and labels active instances by their internal hydration key because
Nuxt does not expose a stable mapping from that key to auto-import metadata.

## Behavior

- The factory and generated composable are synchronous and take no arguments.
- The factory runs lazily, once per Nuxt app, inside an app-lived Vue effect scope.
- Instances are stored in a `WeakMap` keyed by `NuxtApp` for SSR request isolation and garbage
  collection.
- Separate `defineState()` calls always have separate caches.
- HMR recreates the state instead of preserving it.
- Async work should be exposed as a function or use Nuxt data composables such as `useFetch`.

## SSR hydration

Mutable top-level refs and reactive objects returned by the factory are snapshotted after SSR
and restored into client-created values before Vue hydration. The factory result is never
replaced, so its computed refs, watchers, functions, and closures remain connected.

```ts
export const useAccount = defineState(() => {
  const count = ref(0)
  const user = reactive({ name: 'Guest', roles: [] as string[] })
  const double = computed(() => count.value * 2)

  return { count, user, double }
})
```

Nuxt's payload serializer handles nested serializable values, including supported `Date`,
`Map`, `Set`, shared-reference, and cyclic graphs. Functions and readonly computed refs are
recreated by the client factory rather than serialized.

Reactive state that must survive SSR hydration currently needs to be exposed from the
`defineState` factory. Closure-private refs cannot be discovered; mutating one during SSR may
therefore cause a hydration mismatch.

`useFetch()` and `useAsyncData()` retain Nuxt's request caching and payload ownership. When
their returned data ref is exposed, Nuxt's graph serializer keeps the shared payload object
instead of duplicating the response body. The state snapshot adds only metadata overhead.

## Compatibility

Supported:

- `ref`, `reactive`, `shallowRef`, and `shallowReactive`;
- readonly computed values and functions recreated by the client factory;
- readonly views whose mutable source is also returned;
- Nuxt-serializable nested values, shared references, and cycles;
- `useFetch`, `useAsyncData`, `callOnce`, `useCookie`, `useRuntimeConfig`, `useRoute`, and
  `useRouter` in valid Nuxt contexts;
- first use from plugins, middleware, layouts, pages, and components;
- project and Nuxt Layer states.

Limitations:

- Nuxt 4 and Vue 3 only; synchronous factories only.
- Hydrated state must be an enumerable object containing supported mutable members.
- Closure-private mutable state, `customRef`, and writable computed hydration are unsupported.
  Restoring a writable computed may invoke its setter, so return its source refs instead.
- Payload values must be serializable by Nuxt; DOM nodes, sockets, symbols, functions inside
  refs, and arbitrary class/native resources are unsupported.
- No persistence, reset API, keyed instances, or HMR state preservation.
- Context-sensitive Nuxt composables still require a valid Nuxt context.
- The supported transform path is the module's auto-imported `defineState`; barrel re-exports
  and unrelated wrappers are not guaranteed to receive a hydration key.
- DevTools is development-only and read-only.

See [architecture](./docs/architecture.md) for implementation details and the
[roadmap](./docs/roadmap.md) for deferred work.

## Development

Requires Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
pnpm fmt:check
pnpm lint
pnpm test:types
pnpm test
pnpm test:stress
pnpm prepack
pnpm dev:build
```

Install Chromium for browser tests with `pnpm exec playwright-core install chromium`.

## License

[MIT](./LICENSE)
