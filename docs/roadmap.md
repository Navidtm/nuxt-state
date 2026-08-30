# Roadmap

## v0.1.0: basic SSR hydration

Complete:

- stable internal identities through Nuxt's keyed-composable transform;
- one internal namespaced Nuxt payload entry;
- hydration of mutable `ref` and `reactive` members;
- recreation, rather than serialization, of computed values and functions;
- browser coverage for hydration timing and mismatch detection;
- `useFetch` coexistence and request-isolation regression coverage.

The milestone keeps the public `defineState(factory)` API unchanged and ships the payload
format as an internal implementation detail.

## v0.2.0: hardening and compatibility

Complete:

- shallow ref/reactive hydration without changing shallow semantics;
- cycle-safe, graph-aware restore with rich Nuxt-serializable values;
- app-lived effect scope for watchers, route state, and data composables;
- `useAsyncData`, `callOnce`, cookie, runtime-config, router, plugin, middleware, and layout
  compatibility coverage;
- repeated navigation, lazy client state, mount/unmount, and one-time hydration coverage;
- registry cleanup, structural memory audit, 50-request CI concurrency, and optional 200-request
  stress coverage;
- clean-checkout CI type preparation.

The public API remains exactly `defineState(factory)`. v0.2.0 shifts the next phase from adding
capabilities toward preparing and evaluating a focused public Nuxt core proposal.

## Later investigation

- private mutable state hydration without relying on undocumented Vue internals or turning the
  factory into a compiler-managed DSL;
- payload-efficiency guarantees for Nuxt data composables, including whether metadata can be
  omitted through a future public marker or coordination API;
- advanced Vue reactivity primitives and writable computed edge cases;
- Nuxt Layers;
- observational DevTools support;
- richer payload serialization diagnostics;
- further HMR behavior investigation;
- preparation of a public Nuxt core proposal.

These are separate design areas and are not part of v0.2.0.
