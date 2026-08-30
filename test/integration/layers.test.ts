import { fileURLToPath } from 'node:url'
import { $fetch, createPage, setup, url } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('Nuxt Layers', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/layers', import.meta.url)),
    browser: true,
    browserOptions: {
      type: 'chromium',
    },
  })

  it('auto-imports project, local, nested, explicit, and package-layer states', async () => {
    const html = await $fetch<string>('/')

    expect(html).toContain('<output id="layer-project">project-only</output>')
    expect(html).toContain('<output id="layer-permissions">high-permissions</output>')
    expect(html).toContain('<output id="layer-settings">base-settings</output>')
    expect(html).toContain('<output id="layer-navigation">base-navigation</output>')
    expect(html).toContain('<output id="layer-extended">explicit-extends</output>')
    expect(html).toContain('<output id="layer-package">package-layer</output>')
  })

  it('uses normal Nuxt layer priority for collisions', async () => {
    const html = await $fetch<string>('/')

    expect(html).toContain('<output id="layer-auth">project</output>')
    expect(html).toContain('<output id="layer-priority">high</output>')
    expect(html).not.toContain('<output id="layer-auth">base</output>')
    expect(html).not.toContain('<output id="layer-priority">base</output>')
  })

  it('hydrates a layer-defined state before browser mount', async () => {
    const page = await createPage()
    const browserMessages: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') {
        browserMessages.push(message.text())
      }
    })
    page.on('pageerror', (error) => browserMessages.push(error.message))

    await page.goto(url('/hydration'), { waitUntil: 'hydration' })

    await expect(page.locator('#layer-count').textContent()).resolves.toBe('1')
    await expect(page.locator('#layer-double').textContent()).resolves.toBe('2')
    await page.locator('#layer-increment').click()
    await expect(page.locator('#layer-double').textContent()).resolves.toBe('4')
    expect(browserMessages.filter((message) => /hydration|mismatch/i.test(message))).toEqual([])

    await page.close()
  })

  it('keeps layer-defined state isolated across concurrent SSR requests', async () => {
    const [first, second] = await Promise.all([
      $fetch<string>('/isolation?marker=layer-a&delay=50'),
      $fetch<string>('/isolation?marker=layer-b&delay=10'),
    ])

    expect(first).toContain('data-before data-after="layer-a"')
    expect(first).not.toContain('data-after="layer-b"')
    expect(second).toContain('data-before data-after="layer-b"')
    expect(second).not.toContain('data-after="layer-a"')
  })

  it('generates the same layer hydration identity in server and client builds', async () => {
    const html = await $fetch<string>('/hydration')
    const payload = html.match(
      /<script type="application\/json" data-nuxt-data="nuxt-app"[^>]*>(.*?)<\/script>/s,
    )?.[1]

    expect(payload).toContain('__nuxt_state__')
    expect(payload).toContain('"count"')
  })
})
