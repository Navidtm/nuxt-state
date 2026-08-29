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

  it('coexists with useFetch hydration across multiple consumers', async () => {
    const page = await createPage()
    const browserMessages: string[] = []
    const apiRequests: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') {
        browserMessages.push(message.text())
      }
    })
    page.on('pageerror', (error) => browserMessages.push(error.message))
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/example') apiRequests.push(request.url())
    })

    await page.goto(url('/remote?marker=browser'), { waitUntil: 'hydration' })

    await expect(page.locator('#remote-primary-marker').textContent()).resolves.toBe('browser')
    await expect(page.locator('#remote-secondary-marker').textContent()).resolves.toBe('browser')
    await expect(page.locator('#remote-primary-status').textContent()).resolves.toBe('success')
    await expect(page.locator('#remote-primary-has-data').textContent()).resolves.toBe('true')
    expect(apiRequests).toHaveLength(0)

    const initialRequestId = await page.locator('#remote-primary-request').textContent()
    expect(await page.locator('#remote-secondary-request').textContent()).toBe(initialRequestId)

    const response = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/example',
    )
    await page.locator('#remote-refresh').click()
    await response

    await expect
      .poll(() => page.locator('#remote-primary-request').textContent())
      .not.toBe(initialRequestId)
    expect(await page.locator('#remote-secondary-request').textContent()).toBe(
      await page.locator('#remote-primary-request').textContent(),
    )
    expect(apiRequests).toHaveLength(1)
    expect(browserMessages.filter((message) => /hydration|mismatch/i.test(message))).toEqual([])

    await page.close()
  })

  it('characterizes private mutable state as non-hydratable', async () => {
    const page = await createPage()
    const browserMessages: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') {
        browserMessages.push(message.text())
      }
    })
    page.on('pageerror', (error) => browserMessages.push(error.message))

    await page.goto(url('/private-state'), { waitUntil: 'hydration' })

    await expect(page.locator('#private-double').textContent()).resolves.toBe('0')
    expect(
      browserMessages.some((message) =>
        /hydration.*mismatch|text content does not match/i.test(message),
      ),
    ).toBe(true)

    await page.close()
  })

  it('hydrates shallow refs and reactives without making them deep', async () => {
    const page = await createPage()
    const browserMessages: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') {
        browserMessages.push(message.text())
      }
    })
    page.on('pageerror', (error) => browserMessages.push(error.message))

    await page.goto(url('/shallow'), { waitUntil: 'hydration' })

    await expect(page.locator('#catalog-version').textContent()).resolves.toBe('2')
    await expect(page.locator('#catalog-name').textContent()).resolves.toBe('Server')
    await expect(page.locator('#session-user').textContent()).resolves.toBe('Server User')
    await expect(page.locator('#metadata-version').textContent()).resolves.toBe('2')
    await expect(page.locator('#catalog-deep').textContent()).resolves.toBe('false')
    await expect(page.locator('#session-deep').textContent()).resolves.toBe('false')

    await page.locator('#mutate-shallow').click()
    await expect(page.locator('#catalog-version').textContent()).resolves.toBe('2')
    await expect(page.locator('#metadata-version').textContent()).resolves.toBe('2')

    await page.locator('#replace-shallow').click()
    await expect(page.locator('#catalog-version').textContent()).resolves.toBe('4')
    await expect(page.locator('#metadata-version').textContent()).resolves.toBe('4')
    expect(browserMessages.filter((message) => /hydration|mismatch/i.test(message))).toEqual([])

    await page.close()
  })

  it('hydrates rich, shared, and cyclic object graphs without mismatches', async () => {
    const page = await createPage()
    const browserMessages: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') {
        browserMessages.push(message.text())
      }
    })
    page.on('pageerror', (error) => browserMessages.push(error.message))

    await page.goto(url('/graph'), { waitUntil: 'hydration' })

    await expect(page.locator('#shared-value').textContent()).resolves.toBe('41')
    await expect(page.locator('#shared-identity').textContent()).resolves.toBe('true')
    await expect(page.locator('#cycle-value').textContent()).resolves.toBe('server')
    await expect(page.locator('#cycle-identity').textContent()).resolves.toBe('true')
    await expect(page.locator('#date-value').textContent()).resolves.toBe(
      '2026-01-02T03:04:05.000Z',
    )
    await expect(page.locator('#set-value').textContent()).resolves.toBe('a,b')
    await expect(page.locator('#map-value').textContent()).resolves.toBe('a,1,b,2')
    await expect(page.locator('#array-value').textContent()).resolves.toBe('9')
    await expect(page.locator('#obsolete-value').textContent()).resolves.toBe('false')
    expect(browserMessages.filter((message) => /hydration|mismatch/i.test(message))).toEqual([])

    await page.close()
  })

  it('coexists with useAsyncData across hydration, consumers, and refresh', async () => {
    const page = await createPage()
    const browserMessages: string[] = []
    const apiRequests: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') {
        browserMessages.push(message.text())
      }
    })
    page.on('pageerror', (error) => browserMessages.push(error.message))
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/products') apiRequests.push(request.url())
    })

    await page.goto(url('/products'), { waitUntil: 'hydration' })

    await expect(page.locator('#product-primary-count').textContent()).resolves.toBe('2')
    await expect(page.locator('#product-secondary-count').textContent()).resolves.toBe('2')
    await expect(page.locator('#product-primary-status').textContent()).resolves.toBe('success')
    await expect(page.locator('#product-primary-error').textContent()).resolves.toBe('false')
    expect(apiRequests).toHaveLength(0)

    const initialRequestId = await page.locator('#product-primary-request').textContent()
    expect(await page.locator('#product-secondary-request').textContent()).toBe(initialRequestId)

    const response = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/products',
    )
    await page.locator('#product-refresh').click()
    await response
    await expect
      .poll(() => page.locator('#product-primary-request').textContent())
      .not.toBe(initialRequestId)

    expect(await page.locator('#product-secondary-request').textContent()).toBe(
      await page.locator('#product-primary-request').textContent(),
    )
    expect(apiRequests).toHaveLength(1)
    expect(browserMessages.filter((message) => /hydration|mismatch/i.test(message))).toEqual([])

    await page.close()
  })

  it('preserves callOnce results through hydration', async () => {
    const page = await createPage()
    const browserMessages: string[] = []

    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') {
        browserMessages.push(message.text())
      }
    })
    page.on('pageerror', (error) => browserMessages.push(error.message))

    await page.goto(url('/once'), { waitUntil: 'hydration' })

    await expect(page.locator('#once-runs').textContent()).resolves.toBe('1')
    expect(browserMessages.filter((message) => /hydration|mismatch/i.test(message))).toEqual([])

    await page.close()
  })
})
