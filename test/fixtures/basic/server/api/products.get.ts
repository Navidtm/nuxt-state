const description = `NUXT_STATE_ASYNC_DATA:${'p'.repeat(8 * 1024)}`

export default defineEventHandler(() => ({
  requestId: crypto.randomUUID(),
  products: [
    { id: 1, name: 'A', description },
    { id: 2, name: 'B', description },
  ],
}))
