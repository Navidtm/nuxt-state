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

The public API remains exactly `defineState(factory)`.

## v0.3.0: Layers and observation

Complete:

- state discovery from resolved project, local, explicit, and package Nuxt Layers through
  `getLayerDirectories()`;
- native Nuxt/Unimport priority and collision behavior without aliases or override APIs;
- layer hydration, request isolation, nested exports, and HMR characterization;
- development-only, read-only Nuxt DevTools iframe with active state inspection;
- separate known-state source/layer metadata without eager factory execution;
- bounded cyclic-safe value previews, conservative Vue classification, polling only while the
  view is active, and HMR/navigation cleanup coverage;
- exact writable-computed hydration characterization without claiming support.

No alpha/nightly DevTools dependency is required. The public API remains exactly
`defineState(factory)`.

## Later investigation

- private mutable state hydration without relying on undocumented Vue internals or turning the
  factory into a compiler-managed DSL;
- payload-efficiency guarantees for Nuxt data composables, including whether metadata can be
  omitted through a future public marker or coordination API;
- advanced Vue reactivity primitives beyond the v0.3 writable-computed characterization;
- mapping runtime hydration hashes to static export metadata without adding compiler magic;
- DevTools editing, only if a compelling read/write safety model is ever justified;
- default-export convention research without changing the current named-export recommendation;
- a possible skip-hydration concept, without reserving an API today;
- richer payload serialization diagnostics;
- HMR preservation investigation (state reset remains the current contract);
- preparation of a public Nuxt core proposal.

After the focused v0.3.0 observability and Layers milestone, the primary next phase should be a
Nuxt core proposal rather than continued module feature growth.
