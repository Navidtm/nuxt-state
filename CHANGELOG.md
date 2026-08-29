# Changelog

## 0.1.0

- Add transparent SSR hydration for mutable top-level `ref()` and `reactive()` members.
- Use Nuxt's native keyed-composable transform while keeping the public API exactly
  `defineState(factory)`.
- Restore snapshots before Vue hydration so computed values and functions remain connected to
  the client-created refs and reactive proxies.
- Preserve per-Nuxt-app/request isolation, lazy factories, exact return identity, and HMR reset
  behavior.
- Add real Chromium coverage for production and development hydration, mismatch detection,
  reactive updates, concurrent SSR requests, and `useFetch()` coexistence.

The internal payload and snapshot formats are not public API and may change before 1.0.
Mutable state must be returned from the factory to participate in SSR hydration. Nuxt data
composable values can appear in the internal snapshot metadata, but Nuxt's graph serializer
shares the underlying response object rather than serializing its body twice.
