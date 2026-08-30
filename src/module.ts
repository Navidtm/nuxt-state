import { basename, relative, resolve, sep } from 'node:path'
import {
  addDevServerHandler,
  addImports,
  addImportsDir,
  addPlugin,
  addTemplate,
  createResolver,
  defineNuxtModule,
  getLayerDirectories,
} from '@nuxt/kit'
import { registerDevtools } from './devtools/register'

export type ModuleOptions = Record<string, never>

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-state',
    compatibility: {
      nuxt: '^4.0.0',
    },
  },
  defaults: {},
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const defineStateSource = resolver.resolve('./runtime/app/composables/defineState')

    addImports({
      name: 'defineState',
      from: defineStateSource,
    })

    nuxt.options.optimization.keyedComposables.push({
      name: 'defineState',
      source: defineStateSource,
      argumentLength: 2,
    })

    addPlugin(resolver.resolve('./runtime/app/plugins/hydration'))

    const devtools = nuxt.options.devtools
    const devtoolsEnabled =
      nuxt.options.dev &&
      devtools !== false &&
      !(typeof devtools === 'object' && devtools.enabled === false)

    const layers = getLayerDirectories(nuxt)
    const stateDirectories = layers.map((layer) => resolve(layer.app, 'states'))

    if (devtoolsEnabled) {
      const devtoolsRoute = '/__nuxt_state_devtools__/'
      let knownStates: Array<{ name: string; source: string; origin: string }> = []

      nuxt.hook('imports:extend', (imports) => {
        const winners = new Map<string, { name: string; source: string; origin: string }>()

        for (const item of imports) {
          const layerIndex = stateDirectories.findIndex(
            (directory) => item.from === directory || item.from.startsWith(`${directory}${sep}`),
          )
          const name = item.as || item.name
          if (layerIndex < 0 || winners.has(name)) continue

          const layer = layers[layerIndex]!
          const projectRelative = relative(nuxt.options.rootDir, item.from)
          const source = projectRelative.startsWith('..') ? basename(item.from) : projectRelative
          const layerRelative = relative(nuxt.options.rootDir, layer.root).replace(/\/$/, '')

          winners.set(name, {
            name,
            source,
            origin: layerIndex === 0 ? 'Project' : layerRelative || basename(layer.root),
          })
        }

        knownStates = [...winners.values()].sort((a, b) => a.name.localeCompare(b.name))
      })

      addTemplate({
        filename: 'nuxt-state/metadata.mjs',
        getContents: () => `export default ${JSON.stringify(knownStates)}`,
      })

      registerDevtools(devtoolsRoute, nuxt)
      addPlugin(resolver.resolve('./runtime/app/plugins/devtools.client'))
      addDevServerHandler({
        route: devtoolsRoute,
        handler(event) {
          event.node.res.setHeader('content-type', 'text/html; charset=utf-8')
          return renderDevtoolsView()
        },
      })
    }

    // Nuxt assigns scanned imports their native layer priority from the source
    // path. Registering every resolved app directory therefore preserves the
    // project-first order returned by getLayerDirectories without custom aliases.
    addImportsDir(layers.map((layer) => resolve(layer.app, 'states/**')))
  },
})

function renderDevtoolsView(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Nuxt State</title>
  <style>
    :root { color-scheme: light dark; font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #d9e1ea; background: #101418; }
    header { position: sticky; top: 0; z-index: 1; display: flex; gap: 12px; align-items: center; padding: 14px 18px; border-bottom: 1px solid #2a343e; background: #101418ee; }
    h1 { margin: 0 auto 0 0; font-size: 18px; }
    input, button { border: 1px solid #34414d; border-radius: 7px; background: #182027; color: inherit; padding: 7px 10px; }
    input { width: min(280px, 42vw); }
    button { cursor: pointer; }
    main { display: grid; gap: 12px; padding: 16px; }
    article { border: 1px solid #2a343e; border-radius: 10px; background: #151b21; overflow: hidden; }
    article > div { padding: 12px 14px; }
    h2 { margin: 0; font-size: 15px; }
    .meta { color: #94a3b1; font-size: 12px; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 14px; border-top: 1px solid #27313a; text-align: left; vertical-align: top; }
    th { color: #91a0ad; font-size: 11px; text-transform: uppercase; }
    td:nth-child(1) { width: 22%; font-weight: 600; }
    td:nth-child(2) { width: 16%; color: #65d8a5; }
    pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.45 ui-monospace, monospace; }
    .empty, .error { padding: 36px; text-align: center; color: #91a0ad; }
    .badge { display: inline-block; margin-left: 7px; padding: 1px 6px; border-radius: 999px; background: #263a32; color: #7ee2ad; font-size: 11px; }
    @media (prefers-color-scheme: light) {
      body { color: #202832; background: #f7f9fb; }
      header { border-color: #d9e0e6; background: #f7f9fbee; }
      input, button, article { border-color: #d7dfe6; background: white; }
      th, td { border-color: #e3e8ed; }
      .badge { background: #dff7ea; color: #176b43; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Nuxt State <span class="badge">Read only</span></h1>
    <input id="filter" type="search" placeholder="Filter active states">
    <button id="refresh" type="button">Refresh</button>
  </header>
  <main id="states"><p class="empty">Connecting to the Nuxt app…</p></main>
  <script>
    const root = document.querySelector('#states')
    const filter = document.querySelector('#filter')
    let activeStates = []
    let knownStates = []
    let timer
    let visible = true
    let refreshing = false

    const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
    const render = () => {
      const query = filter.value.trim().toLowerCase()
      const shown = activeStates.filter(state => (state.name + ' ' + state.key).toLowerCase().includes(query))
      const known = knownStates.filter(state => (state.name + ' ' + state.source + ' ' + state.origin).toLowerCase().includes(query))
      const activeHTML = shown.length
        ? shown.map(state => '<article><div><h2>' + escapeHTML(state.name) + '<span class="badge">' + escapeHTML(state.hydration) + '</span></h2><div class="meta">Internal hydration key: ' + escapeHTML(state.key) + '</div></div><table><thead><tr><th>Member</th><th>Kind</th><th>Value preview</th></tr></thead><tbody>' + state.members.map(member => '<tr><td>' + escapeHTML(member.name) + '</td><td>' + escapeHTML(member.kind) + '</td><td><pre>' + escapeHTML(JSON.stringify(member.value, null, 2)) + '</pre></td></tr>').join('') + '</tbody></table></article>').join('')
        : '<p class="empty">' + (activeStates.length ? 'No matching active states.' : 'No active states yet. Opening this panel does not instantiate lazy state.') + '</p>'
      const knownHTML = known.length
        ? '<article><div><h2>Known states</h2><div class="meta">Discovered statically; factories remain lazy.</div></div><table><thead><tr><th>Name</th><th>Origin</th><th>Source</th></tr></thead><tbody>' + known.map(state => '<tr><td>' + escapeHTML(state.name) + '</td><td>' + escapeHTML(state.origin) + '</td><td><pre>' + escapeHTML(state.source) + '</pre></td></tr>').join('') + '</tbody></table></article>'
        : ''
      root.innerHTML = activeHTML + knownHTML
    }
    const refresh = async () => {
      if (!visible || refreshing) return
      refreshing = true
      try {
        const client = window.__NUXT_DEVTOOLS__
        if (!client?.host?.nuxt) throw new Error('Nuxt DevTools host is not connected.')
        const request = { result: undefined }
        await client.host.nuxt.callHook('nuxt-state:inspect', request)
        activeStates = request.result?.active || []
        knownStates = request.result?.known || []
        render()
      } catch (error) {
        root.innerHTML = '<p class="error">' + escapeHTML(error?.message || error) + '</p>'
      } finally {
        refreshing = false
      }
    }
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting)
      if (visible) refresh()
    })
    observer.observe(document.documentElement)
    filter.addEventListener('input', render)
    document.querySelector('#refresh').addEventListener('click', refresh)
    timer = setInterval(refresh, 1000)
    addEventListener('pagehide', () => { clearInterval(timer); observer.disconnect() }, { once: true })
    refresh()
  </script>
</body>
</html>`
}
