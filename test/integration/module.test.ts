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
})
