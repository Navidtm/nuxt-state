# Technical roadmap

This document records research directions, not committed public API.

## Stable internal keys and hydration

Nuxt's keyed-composable compiler transform can inject a stable hash derived from a source
file and call location. Nuxt currently exposes this to module authors through
`nuxt.options.optimization.keyedComposables`, configured with a function name, exact
resolved import source, and argument length.

A future implementation could keep the public call unchanged:

```ts
defineState(factory)
```

while compiling it to an internal form conceptually like:

```ts
defineState(factory, generatedInternalKey)
```

The internal key could identify an SSR payload entry and distinguish multiple calls in
one file without asking users to maintain IDs. It must not become a documented second
public argument.

Before adopting this design, a prototype must verify all of the following:

1. The transform recognizes `defineState` when it is auto-imported.
2. It recognizes calls inside files discovered through `app/states/` auto-imports.
3. Its exact-source matching remains stable for built modules and development stubs.
4. Multiple calls in one file receive different stable keys.
5. Keys match between server and client production builds.
6. HMR and file moves have understandable reset behavior.
7. Payload data includes only explicitly supported serializable state, never the whole
   factory return value.

Nuxt's transform requires exact resolved import-source matching and does not follow barrel
re-exports. Auto-import generation and the module builder therefore need integration tests,
not assumptions based only on direct imports.

## Hydration model

The factory return value cannot safely be serialized because it may contain functions,
computed refs, reactive proxies, classes, and other runtime-only values. A future design
needs an explicit, narrow rule for which Vue state is payload-backed and how it reconnects
to the client-created runtime object. Until then, request isolation is the only SSR promise.

## Nuxt composables in factories

Because a factory runs lazily from a state composable invocation, some context-sensitive
Nuxt composables may work naturally. Broad support must wait for lifecycle tests covering
`useRoute`, `useRuntimeConfig`, `useCookie`, middleware, plugins, server rendering, client
navigation, and calls after an awaited boundary. v0 makes no blanket compatibility claim.

## Other deferred topics

- Nuxt Layers and how multiple application source directories contribute states.
- Optional HMR state preservation without changing the public API.
- DevTools visibility, only if it can stay observational rather than introducing a store DSL.

