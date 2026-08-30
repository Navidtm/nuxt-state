import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('nuxt-state module', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
  })

  it('auto-imports defineState and top-level, nested, and multiple state exports', async () => {
    const response = await fetch('/')
    const html = await response.text()

    if (!response.ok) {
      throw new Error(`Fixture returned ${response.status}: ${html}`)
    }

    expect(html).toContain('1:2:nested-state:first:second')
  })

  it('does not expose the DevTools view in production', async () => {
    const response = await fetch('/__nuxt_state_devtools__/')

    expect(response.status).toBe(404)
    expect(await response.text()).not.toContain('Nuxt State <span class="badge">Read only')
  })

  it('isolates state between concurrent SSR requests', async () => {
    const [first, second] = await Promise.all([
      $fetch<string>('/isolation?marker=first&delay=50'),
      $fetch<string>('/isolation?marker=second&delay=10'),
    ])

    expect(first).toContain('data-before data-after="first"')
    expect(first).toContain('data-after="first"')
    expect(first).not.toContain('data-after="second"')
    expect(second).toContain('data-before data-after="second"')
    expect(second).toContain('data-after="second"')
    expect(second).not.toContain('data-after="first"')
  })

  it('serializes final SSR mutations in one namespaced payload', async () => {
    const html = await $fetch<string>('/hydration')

    expect(html).toContain('<output id="count">41</output>')
    expect(html).toContain('<output id="double">82</output>')
    expect(html).toContain('<output id="user-name">Server User</output>')
    expect(html).toContain('__nuxt_state__')
  })

  it('keeps useFetch state isolated between concurrent SSR requests', async () => {
    const [first, second] = await Promise.all([
      $fetch<string>('/remote?marker=request-a'),
      $fetch<string>('/remote?marker=request-b'),
    ])

    expect(first).toContain('<output id="remote-primary-marker">request-a</output>')
    expect(first).toContain('<output id="remote-secondary-marker">request-a</output>')
    expect(first).not.toContain('<output id="remote-primary-marker">request-b</output>')
    expect(second).toContain('<output id="remote-primary-marker">request-b</output>')
    expect(second).toContain('<output id="remote-secondary-marker">request-b</output>')
    expect(second).not.toContain('<output id="remote-primary-marker">request-a</output>')
  })

  it('characterizes private mutable state as invisible to snapshots', async () => {
    const html = await $fetch<string>('/private-state')

    expect(html).toContain('<output id="private-double">2</output>')
    expect(html).toMatch(/"__nuxt_state__":\d+/)
    expect(html).not.toContain('"type":"ref"')
  })

  it('does not serialize a large useFetch response twice', async () => {
    const [directHTML, stateHTML] = await Promise.all([
      $fetch<string>('/payload-direct'),
      $fetch<string>('/payload-state'),
    ])
    const payloadPattern =
      /<script type="application\/json" data-nuxt-data="nuxt-app"[^>]*>(.*?)<\/script>/s
    const directPayload = directHTML.match(payloadPattern)?.[1]
    const statePayload = stateHTML.match(payloadPattern)?.[1]

    expect(directPayload).toBeTruthy()
    expect(statePayload).toBeTruthy()
    expect(directPayload!.match(/NUXT_STATE_LARGE_PAYLOAD/g)).toHaveLength(1)
    expect(statePayload!.match(/NUXT_STATE_LARGE_PAYLOAD/g)).toHaveLength(1)
    expect(statePayload).toContain('__nuxt_state__')

    const payloadOverhead = Buffer.byteLength(statePayload!) - Buffer.byteLength(directPayload!)
    const htmlOverhead = Buffer.byteLength(stateHTML) - Buffer.byteLength(directHTML)

    // Nuxt's graph serializer points both payload entries at the same response object.
    // Only nuxt-state's small snapshot metadata should be added, not another 16 KiB value.
    expect(payloadOverhead).toBeLessThan(128)
    expect(htmlOverhead).toBeLessThan(256)
  })

  it('renders final shallow state into SSR HTML and hydration payload', async () => {
    const html = await $fetch<string>('/shallow')

    expect(html).toContain('<output id="catalog-version">2</output>')
    expect(html).toContain('<output id="session-user">Server User</output>')
    expect(html).toContain('<output id="catalog-deep">false</output>')
    expect(html).toContain('<output id="session-deep">false</output>')
    expect(html).toContain('__nuxt_state__')
  })

  it('coexists with useAsyncData without duplicating its response body', async () => {
    const [directHTML, stateHTML] = await Promise.all([
      $fetch<string>('/products-direct'),
      $fetch<string>('/products'),
    ])
    const payloadPattern =
      /<script type="application\/json" data-nuxt-data="nuxt-app"[^>]*>(.*?)<\/script>/s
    const directPayload = directHTML.match(payloadPattern)?.[1]
    const statePayload = stateHTML.match(payloadPattern)?.[1]

    expect(stateHTML).toContain('<output id="product-primary-count">2</output>')
    expect(stateHTML).toContain('<output id="product-secondary-count">2</output>')
    expect(directPayload!.match(/NUXT_STATE_ASYNC_DATA/g)).toHaveLength(1)
    expect(statePayload!.match(/NUXT_STATE_ASYNC_DATA/g)).toHaveLength(1)
    expect(Buffer.byteLength(statePayload!) - Buffer.byteLength(directPayload!)).toBeLessThan(256)
  })

  it('supports callOnce from an exposed state function during SSR', async () => {
    const html = await $fetch<string>('/once')

    expect(html).toContain('<output id="once-runs">1</output>')
    expect(html).toContain('nuxt-state-initialize')
  })

  it('shares one state across plugin, middleware, layout, page, and component', async () => {
    const html = await $fetch<string>('/context-a')

    expect(html).toContain('<output id="plugin-shared">true</output>')
    expect(html).toContain('<output id="middleware-shared">true</output>')
    expect(html).toContain('<output id="layout-shared">true</output>')
    expect(html).toContain('<output id="page-shared">true</output>')
    expect(html).toContain('<output id="component-shared">true</output>')
    expect(html).toContain('<output id="runtime-label">fixture-runtime-config</output>')
    expect(html).toContain('<output id="context-path">/context-a</output>')
    expect(html).toContain('<output id="cookie-authenticated">true</output>')
  })

  it('does not initialize navigation-only state during unrelated SSR', async () => {
    const html = await $fetch<string>('/navigation-a')

    expect(html).toContain('<output id="navigation-count">10</output>')
    expect(html).not.toContain('lazy-id')
    expect(html).not.toContain('lazy-component-id')
  })

  it('isolates many concurrent SSR HTML and hydration payloads', async () => {
    const markers = Array.from({ length: 50 }, (_, index) => `stress-${index + 1}`)
    const responses = await Promise.all(
      markers.map((marker, index) =>
        $fetch<string>(`/isolation?marker=${marker}&delay=${index % 5}`),
      ),
    )

    for (const [index, html] of responses.entries()) {
      const marker = markers[index]!
      const observedMarkers = new Set(html.match(/stress-\d+/g) ?? [])

      expect(html).toContain(`data-after="${marker}"`)
      expect(html).toContain('__nuxt_state__')
      expect(observedMarkers).toEqual(new Set([marker]))
    }
  })

  it('characterizes writable computed as mutable snapshot state', async () => {
    const html = await $fetch<string>('/writable-computed')

    expect(html).toContain('<output id="writable-first">Server</output>')
    expect(html).toContain('<output id="writable-last">User</output>')
    expect(html).toContain('<output id="writable-full">Server User</output>')
    expect(html).toContain('<output id="writable-setter-calls">pending</output>')
    expect(html).toMatch(/"fullName":\d+.*?"Server User"/s)
  })
})
