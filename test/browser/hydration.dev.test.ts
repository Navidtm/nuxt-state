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

  it('serves a read-only inspector without instantiating lazy states', async () => {
    const page = await createPage()
    await page.goto(url('/devtools'), { waitUntil: 'hydration' })

    await expect(page.locator('#devtools-count').textContent()).resolves.toBe('4')
    await expect(page.locator('#devtools-lazy-calls').textContent()).resolves.toBe('0')
    await page.keyboard.press('Shift+Alt+D')

    const inspect = () =>
      page.evaluate(async () => {
        const host = (
          window as typeof window & {
            __NUXT_DEVTOOLS_HOST__?: {
              nuxt: { callHook: (name: string, request: object) => Promise<void> }
            }
          }
        ).__NUXT_DEVTOOLS_HOST__
        const vueApp = (
          document.querySelector('#__nuxt') as Element & {
            __vue_app__?: {
              config: {
                globalProperties: {
                  $nuxt?: { callHook: (name: string, request: object) => Promise<void> }
                }
              }
            }
          }
        )?.__vue_app__
        const nuxt = host?.nuxt || vueApp?.config.globalProperties.$nuxt
        if (!nuxt) return
        const request: { result?: unknown } = {}
        await nuxt.callHook('nuxt-state:inspect', request)
        return request.result
      })

    await expect.poll(inspect).toBeTruthy()
    const initial = (await inspect()) as {
      active: Array<{ key: string; hydration: string; members: Array<Record<string, unknown>> }>
      known: Array<{ name: string; source: string; origin: string }>
    }

    expect(initial.active).toHaveLength(1)
    expect(initial.active[0]?.key).toMatch(/^\$/)
    expect(initial.active[0]?.hydration).toBe('Hydrated')
    expect(initial.active[0]?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'increment', kind: 'function', value: 'ƒ increment()' }),
        expect.objectContaining({ name: 'double', kind: 'readonly ref', value: 8 }),
      ]),
    )
    expect(JSON.stringify(initial.active)).toContain('"reference":"#')
    expect(JSON.stringify(initial.active)).toContain('"truncated":true')
    expect(initial.known).toEqual(
      expect.arrayContaining([
        {
          name: 'useDevtoolsActiveState',
          source: 'app/states/devtools.ts',
          origin: 'Project',
        },
        {
          name: 'useDevtoolsLazyState',
          source: 'app/states/devtools.ts',
          origin: 'Project',
        },
      ]),
    )

    await page.locator('#devtools-increment').click()
    await expect(page.locator('#devtools-count').textContent()).resolves.toBe('5')
    await expect
      .poll(async () => {
        const result = (await inspect()) as typeof initial
        return result.active[0]?.members.find(({ name }) => name === 'count')?.value
      })
      .toBe(5)
    await expect(page.locator('#devtools-lazy-calls').textContent()).resolves.toBe('0')

    await page.locator('#devtools-navigation').click()
    await page.waitForURL('**/devtools-lazy')
    await expect(page.locator('#devtools-lazy-factory-calls').textContent()).resolves.toBe('1')
    await expect
      .poll(async () => {
        const result = (await inspect()) as typeof initial
        return result.active.map(({ hydration }) => hydration).sort()
      })
      .toEqual(['Client-only', 'Hydrated'])

    await page.locator('#devtools-back').click()
    await page.waitForURL('**/devtools')
    await expect(page.locator('#devtools-lazy-calls').textContent()).resolves.toBe('1')
    await expect
      .poll(async () => {
        const result = (await inspect()) as typeof initial
        return result.active.length
      })
      .toBe(2)

    const view = await page.request.get(url('/__nuxt_state_devtools__/'))
    expect(view.status()).toBe(200)
    expect(await view.text()).toContain('Read only')

    await page.close()
  })
})
