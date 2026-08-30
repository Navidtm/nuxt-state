# nuxt-state

> Define shared Nuxt state using the same Composition API you already use in composables.

`nuxt-state` is an experimental Nuxt 4 module that explores one small primitive:

```ts
defineState(() => {
  // standard Vue Composition API
  return {/* public state */}
})
```

A regular composable runs its factory for every invocation. A composable created by
`defineState` runs its factory lazily, once for the current Nuxt application instance,
and returns that exact result to every caller in that app.

This is a working open-source prototype for discussion and possible future contribution to
Nuxt. The API is intentionally narrow and the project is not yet presented as production-ready.

## Why

Nuxt's `useState()` is excellent for simple SSR-aware values. Pinia is a strong choice
when an application wants a dedicated state-management library and its ecosystem.
This project does not replace either one. It explores a lightweight native abstraction
between a raw `useState()` value and a full state-management library.

There are no stores, actions, getters, mutations, IDs, configuration objects, or special
wrappers. The factory and its return value use normal Vue semantics.

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

Create a state in Nuxt 4's application source directory:

```ts
// app/states/counter.ts
export const useCounter = defineState(() => {
  const count = ref(0)
  const double = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return {
    count,
    double,
    increment,
  }
})
```

Exports from `app/states/`, including nested directories and multiple exports per file,
are auto-imported. `defineState` is also auto-imported and can be used elsewhere, such
as in `app/composables/`.

```vue
<script setup lang="ts">
const { count, double, increment } = useCounter()

count.value++
increment()
console.log(double.value)
</script>
```

Calling `useCounter()` in ten components returns the same object for that Nuxt app.
Different server requests and different client apps receive different objects.

The returned object is not cloned, wrapped, or transformed. Refs remain refs, computed
refs remain computed refs, reactive objects remain reactive, and functions are unchanged.

## Semantics

- The factory is synchronous and takes no arguments.
- The generated composable takes no arguments.
- The factory is lazy and runs at first use.
- It runs once per Nuxt app instance.
- The exact factory result is returned to all callers in that app.
- The factory runs in a detached Vue effect scope owned by the Nuxt app, so effects and Nuxt
  composables are not disposed with the first consuming component.
- A module-local `WeakMap` keys instances by `NuxtApp`, providing request isolation while
  allowing old application instances to be garbage-collected.
- Separate `defineState()` calls have separate closure-owned caches, including calls in
  the same file.
- Mutable state used during SSR is restored into the client-created refs and reactive proxies
  before Vue hydrates the component tree.

Async factories are rejected by TypeScript and guarded at runtime for JavaScript users.
Expose an async function from synchronous state or use Nuxt's data-fetching APIs instead.

## SSR hydration

Since v0.1.0, nuxt-state transparently hydrates mutable top-level members returned by the factory.
Nuxt injects an internal call-site key at build time; the developer-facing call remains exactly
`defineState(factory)`.

On the server, the module captures the final values after rendering in one namespaced Nuxt
payload entry. On the client, it runs the factory normally and patches those values into the
new refs and reactive proxies before Vue hydration. The returned object is never replaced, so
computed refs, functions, watchers, and closures created by the client factory remain wired to
the hydrated state.

```ts
export const useAccount = defineState(() => {
  const count = ref(0)
  const user = reactive({ name: 'Guest', roles: [] as string[] })
  const double = computed(() => count.value * 2)
  const increment = () => count.value++

  return { count, user, double, increment }
})
```

Nested serializable values inside supported refs and reactive objects are handled by Nuxt's
payload serializer. Functions, readonly computed refs, and plain runtime objects are recreated
by the factory rather than serialized. Concurrent SSR requests retain separate Nuxt-app
registries and cannot share user state.

Snapshot discovery is intentionally limited to mutable members exposed by the factory. Reactive
state that must survive SSR hydration currently needs to be exposed from the `defineState`
factory. A private ref captured only by a computed value or function is not visible to the
snapshot layer; if it is mutated during SSR, its client value can differ and cause a hydration
mismatch. Discovering closure-private Vue state would require a new explicit API, compiler-level
analysis, or undocumented reactivity inspection, none of which belongs in v0.2.0.

`useFetch()` can remain inside a synchronous state factory. Its request caching and payload
hydration still belong to Nuxt; `nuxt-state` neither replaces nor triggers a second fetch
mechanism. If multiple sibling SSR components must all render completed data, await the returned
Nuxt `AsyncData` promise in a parent/page as you would with normal Nuxt data fetching.

When a returned `useFetch().data` ref is snapshotted, both Nuxt's data payload and the internal
state snapshot refer to it. Nuxt's graph serializer preserves the shared object identity, so the
response body is emitted once rather than copied into the HTML twice. There is still a small
snapshot-metadata overhead.

## Compatibility

### Supported

- `ref()` and `reactive()`, including nested serializable objects and arrays;
- `shallowRef()` and `shallowReactive()` with their shallow semantics preserved;
- `Date`, `Map`, `Set`, shared references, and cyclic graphs supported by Nuxt's payload
  serializer;
- readonly computed chains and functions as client-recreated runtime state;
- readonly views when their mutable source is also returned and hydrated;
- `useFetch()`, `useAsyncData()`, `callOnce()`, `useCookie()`, `useRuntimeConfig()`, `useRoute()`,
  and `useRouter()` in valid Nuxt contexts;
- first use from plugins, route middleware, layouts, pages, and components;
- state lifetime across client navigation and repeated component mount/unmount.

`useFetch` and `useAsyncData` continue to own their request/payload behavior. nuxt-state's
snapshot metadata points at the same payload graph rather than serializing response bodies again.
`callOnce({ mode: 'navigation' })` retains Nuxt's normal per-navigation behavior.

### Characterized or limited

- A readonly view is not independent mutable state. If its mutable source is private, it follows
  the private-state limitation below.
- Writable computed refs are not supported hydration state. Vue exposes no public `isComputed`
  check, and a writable computed currently looks like a mutable ref; restoring it invokes its
  setter and may cause side effects. Return and hydrate its source refs instead.
- Mutable reactive values that must survive SSR hydration need to be reachable through the
  enumerable object returned from the factory.
- The intended return is a composable-style object. Arbitrary ref, reactive-root, function, or
  primitive returns still share per app, but the current member-based snapshot format does not
  hydrate them.
- Cycles are supported for Nuxt-serializable object graphs, not arbitrary native resources or
  custom class instances.

## Current limitations

- Nuxt 4 and Vue 3 only.
- Synchronous factories only.
- No persistence or browser-storage integration.
- Hydration is guaranteed for standard and shallow refs/reactives. `customRef()` and writable
  computed hydration are not supported.
- Hydrated values must be serializable by Nuxt's payload system; DOM nodes, sockets, functions
  inside refs, symbols, and arbitrary native/class resources are unsupported.
- Closure-private mutable state is not discoverable; return any ref/reactive value whose SSR
  mutations must hydrate.
- No Nuxt Layers support yet.
- State resets when its module is hot-reloaded; HMR preservation is not implemented.
- Context-sensitive composables must still be called while normal Nuxt context is available.
- There is no reset API, keyed/multi-instance state, DevTools integration, or central
  user-facing registry.
- The keyed transform is source-sensitive. The supported path is the module's auto-imported
  `defineState`; a barrel re-export or unrelated manual wrapper is not guaranteed to receive an
  internal hydration key.

See [the architecture notes](./docs/architecture.md) and [roadmap](./docs/roadmap.md) for
implementation constraints and deferred work.

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

The browser suite requires Chromium, installed with
`pnpm exec playwright-core install chromium`. The playground contains two counter components,
a reactive object example, a nested state, and two independent states exported from one file.

## License

[MIT](./LICENSE)
