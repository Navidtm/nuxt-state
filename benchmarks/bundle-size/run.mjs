import { brotliCompressSync, gzipSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const benchmarkDir = dirname(fileURLToPath(import.meta.url))
const repositoryDir = resolve(benchmarkDir, '../..')
const nuxtBin = resolve(repositoryDir, 'node_modules/nuxt/bin/nuxt.mjs')
const fixtureNames = ['baseline', 'nuxt-state', 'pinia']

for (const name of fixtureNames) {
  const fixtureDir = join(benchmarkDir, 'fixtures', name)

  cleanFixture(fixtureDir)

  console.log(`\nBuilding ${name}...`)
  execFileSync(process.execPath, [nuxtBin, 'build', fixtureDir], {
    cwd: repositoryDir,
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: 'inherit',
  })
}

const measurements = Object.fromEntries(
  fixtureNames.map((name) => {
    const publicDir = join(benchmarkDir, 'fixtures', name, '.output/public')
    const assets = findJavaScript(publicDir).map((path) => {
      const contents = readFileSync(path)

      return {
        file: relative(publicDir, path),
        raw: contents.byteLength,
        gzip: gzipSync(contents, { level: 9 }).byteLength,
        brotli: brotliCompressSync(contents).byteLength,
      }
    })

    return [
      name,
      {
        assets,
        total: sumSizes(assets),
      },
    ]
  }),
)

const baseline = measurements.baseline.total
const nuxtState = measurements['nuxt-state'].total
const pinia = measurements.pinia.total
const rows = fixtureNames.map((name) => ({
  name,
  ...measurements[name].total,
  rawDelta: measurements[name].total.raw - baseline.raw,
  gzipDelta: measurements[name].total.gzip - baseline.gzip,
  brotliDelta: measurements[name].total.brotli - baseline.brotli,
}))

const result = {
  generatedAt: new Date().toISOString(),
  runtime: {
    node: process.version,
    nuxt: packageVersion('nuxt'),
    nuxtState: packageVersion('nuxt-state'),
    piniaNuxt: packageVersion('@pinia/nuxt'),
    pinia: packageVersion('pinia'),
  },
  methodology: 'Production client JavaScript; compressed per asset; delta relative to baseline.',
  comparison: {
    lighter: nuxtState.brotli <= pinia.brotli ? 'nuxt-state' : 'pinia',
    difference: {
      raw: Math.abs(nuxtState.raw - pinia.raw),
      gzip: Math.abs(nuxtState.gzip - pinia.gzip),
      brotli: Math.abs(nuxtState.brotli - pinia.brotli),
    },
  },
  measurements,
}

const resultsDir = join(benchmarkDir, 'results')
mkdirSync(resultsDir, { recursive: true })
writeFileSync(join(resultsDir, 'latest.json'), `${JSON.stringify(result, null, 2)}\n`)

for (const name of fixtureNames) {
  cleanFixture(join(benchmarkDir, 'fixtures', name))
}

console.log('\nClient JavaScript bundle size (bytes)')
console.table(rows)
console.log(
  `${result.comparison.lighter} is ${result.comparison.difference.brotli} Brotli bytes lighter in this benchmark.`,
)
console.log(`Detailed result: ${relative(repositoryDir, join(resultsDir, 'latest.json'))}`)

function cleanFixture(fixtureDir) {
  for (const directory of ['.nuxt', '.output', 'node_modules']) {
    rmSync(join(fixtureDir, directory), { recursive: true, force: true })
  }
}

function findJavaScript(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) return findJavaScript(path)
    return entry.isFile() && entry.name.endsWith('.js') ? [path] : []
  })
}

function sumSizes(assets) {
  return assets.reduce(
    (total, asset) => ({
      raw: total.raw + asset.raw,
      gzip: total.gzip + asset.gzip,
      brotli: total.brotli + asset.brotli,
    }),
    { raw: 0, gzip: 0, brotli: 0 },
  )
}

function packageVersion(name) {
  const packagePath =
    name === 'nuxt-state'
      ? join(repositoryDir, 'package.json')
      : join(repositoryDir, 'node_modules', ...name.split('/'), 'package.json')

  return JSON.parse(readFileSync(packagePath, 'utf8')).version
}
