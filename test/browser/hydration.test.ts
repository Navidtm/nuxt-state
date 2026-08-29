import { fileURLToPath } from 'node:url'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('browser hydration', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
    browser: true,
    browserOptions: {
      type: 'chromium',
    },
  })

  it('hydrates refs and reactives before mount without mismatches', async () => {
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
    await expect(page.locator('#user-name').textContent()).resolves.toBe('Server User')
    await expect(page.locator('#authenticated').textContent()).resolves.toBe('true')
    await expect(page.locator('#label').textContent()).resolves.toBe('Server User')

    await page.locator('#increment').click()
    await expect(page.locator('#count').textContent()).resolves.toBe('42')
    await expect(page.locator('#double').textContent()).resolves.toBe('84')

    await page.locator('#login').click()
    await expect(page.locator('#user-name').textContent()).resolves.toBe('Client Update')
    await expect(page.locator('#label').textContent()).resolves.toBe('Client Update')

    expect(browserMessages.filter((message) => /hydration|mismatch/i.test(message))).toEqual([])

    await page.close()
  })
})
