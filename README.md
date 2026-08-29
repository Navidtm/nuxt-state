# nuxt-define-state

> Define shared Nuxt state using the same Composition API you already use in composables.

`nuxt-define-state` is an experimental Nuxt 4 module that explores one small primitive:

```ts
defineState(() => {
  // standard Vue Composition API
  return { /* public state */ }
})
```

A regular composable runs its factory for every invocation. A composable created by
`defineState` runs its factory lazily, once for the current Nuxt application instance,
and returns that exact result to every caller in that app.

This is a working prototype for discussion and possible future contribution to Nuxt.
It is not yet presented as production-ready.

## Why

Nuxt's `useState()` is excellent for simple SSR-aware values. Pinia is a strong choice
when an application wants a dedicated state-management library and its ecosystem.
This project does not replace either one. It explores a lightweight native abstraction
between a raw `useState()` value and a full state-management library.

There are no stores, actions, getters, mutations, IDs, configuration objects, or special
wrappers. The factory and its return value use normal Vue semantics.

## Install

```bash
pnpm add nuxt-define-state
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-define-state'],
})
```

The package has not been published yet; during development, use this repository as a
workspace dependency.

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
- A module-local `WeakMap` keys instances by `NuxtApp`, providing request isolation while
  allowing old application instances to be garbage-collected.
- Separate `defineState()` calls have separate closure-owned caches, including calls in
  the same file.

Async factories are rejected by TypeScript and guarded at runtime for JavaScript users.
Expose an async function from synchronous state or use Nuxt's data-fetching APIs instead.

## SSR scope

v0 guarantees isolation between SSR requests: module-level state does not become a
process-wide user-state singleton. This is intentionally different from hydration.

v0 does **not** serialize or hydrate arbitrary factory results. A result may contain
functions, computed refs, class instances, and other runtime-only values. If a state is
mutated during SSR, the client may recreate the factory's initial state during hydration.
Do not rely on server mutations transferring to the client yet.

## Current limitations

- Nuxt 4 and Vue 3 only.
- Synchronous factories only.
- No persistence or browser-storage integration.
- No arbitrary-state payload serialization or hydration yet.
- No Nuxt Layers support yet.
- State resets when its module is hot-reloaded; HMR preservation is not implemented.
- Compatibility with every context-sensitive Nuxt composable inside a factory is not
  guaranteed yet.
- There is no reset API, keyed/multi-instance state, DevTools integration, or central
  registry.

See [ROADMAP.md](./ROADMAP.md) for the technical questions behind future hydration and
context compatibility.

## Development

Requires Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
pnpm lint
pnpm test:types
pnpm test
pnpm prepack
pnpm dev:build
```

The playground contains two counter components, a reactive object example, a nested
state, and two independent states exported from one file.

## License

[MIT](./LICENSE)

