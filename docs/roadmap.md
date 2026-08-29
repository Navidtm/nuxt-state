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

## Later investigation

- private mutable state hydration without relying on undocumented Vue internals or turning the
  factory into a compiler-managed DSL;
- payload-efficiency guarantees for Nuxt data composables, including whether metadata can be
  omitted through a future public marker or coordination API;
- `shallowRef` and `shallowReactive` guarantees;
- advanced Vue reactivity primitives and writable computed edge cases;
- Nuxt Layers;
- observational DevTools support;
- richer payload serialization diagnostics;
- further HMR behavior investigation;
- preparation of an eventual Nuxt core proposal.

These are separate design areas and are not part of v0.1.0.
