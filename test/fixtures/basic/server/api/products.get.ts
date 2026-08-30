const description = `NUXT_STATE_ASYNC_DATA:${'p'.repeat(8 * 1024)}`

export default defineEventHandler((event) => {
  if (getQuery(event).fail === '1') {
    throw createError({ statusCode: 500, statusMessage: 'Expected product failure' })
  }

  return {
    requestId: crypto.randomUUID(),
    products: [
      { id: 1, name: 'A', description },
      { id: 2, name: 'B', description },
    ],
  }
})
