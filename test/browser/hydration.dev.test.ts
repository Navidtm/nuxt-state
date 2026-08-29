import { fileURLToPath } from 'node:url'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('development hydration', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
    dev: true,
    browser: true,
    browserOptions: {
      type: 'chromium',
    },
  })

  it('uses matching generated keys in the development server and client', async () => {
    const page = await createPage()
    const browserMessages: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') {
        browserMessages.push(message.text())
      }
    })
    page.on('pageerror', (error) => browserMessages.push(error.message))

    await page.goto(url('/hydration'), { waitUntil: 'hydration' })

    await expect(page.locator('#count').textContent()).resolves.toBe('41')
    await expect(page.locator('#double').textContent()).resolves.toBe('82')
    expect(browserMessages.filter((message) => /hydration|mismatch/i.test(message))).toEqual([])

    await page.close()
  })
})
