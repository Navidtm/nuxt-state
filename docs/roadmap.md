# Roadmap

## Completed

### v0.1.0 — SSR hydration

- Nuxt keyed-composable identity with unchanged `defineState(factory)` API;
- namespaced payload snapshots for returned refs and reactive objects;
- client restoration before hydration;
- request-isolation, browser hydration, and `useFetch` coverage.

### v0.2.0 — hardening

- shallow and graph-aware restoration for serializable values;
- app-lived effect scopes and cleanup;
- broader Nuxt composable and lifecycle coverage;
- concurrency, memory-ownership, and stress tests.

### v0.3.0 — Layers and DevTools

- state discovery across project, local, extended, and package Nuxt Layers;
- native layer priority, hydration, isolation, and HMR coverage;
- development-only, read-only Nuxt DevTools inspector;
- bounded previews and known-state source/layer metadata;
- writable-computed behavior characterized without claiming support.

## Future investigation

- propose the primitive and required hooks to Nuxt core;
- hydrate private mutable state without undocumented Vue internals or a compiler-managed DSL;
- expose a public way to coordinate payload metadata with Nuxt data composables;
- map runtime hydration keys to static export metadata safely;
- investigate advanced Vue primitives, diagnostics, default exports, skip-hydration, and HMR
  preservation;
- consider DevTools editing only if a safe read/write model is justified.

The next priority is a Nuxt core proposal rather than expanding the module API.
