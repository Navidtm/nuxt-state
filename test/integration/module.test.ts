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
})
