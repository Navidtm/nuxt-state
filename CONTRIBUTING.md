# Contributing

Thanks for helping explore `defineState` as a possible small Nuxt primitive.

## Scope

Please keep proposals aligned with the project's intentionally narrow API. Features such
as persistence, reset APIs, actions/getters, arguments, user-supplied keys, ref unwrapping,
and Pinia integration are outside v0. Open an issue before making a change that expands the
public API or SSR guarantees.

## Setup

Use Node.js 22+ and pnpm:

```bash
pnpm install
pnpm fmt:check
pnpm dev
```

Before opening a pull request, run:

```bash
pnpm lint
pnpm test:types
pnpm test
pnpm prepack
pnpm dev:build
```

The full test command includes real Chromium hydration coverage. Install its browser locally
with `pnpm exec playwright-core install chromium` if needed. Tests should distinguish
per-request safety from server-to-client hydration. New runtime behavior should include unit
coverage, while Nuxt integration behavior should use a fixture through `@nuxt/test-utils`.

Please explain behavioral changes and update the README or roadmap where appropriate.
