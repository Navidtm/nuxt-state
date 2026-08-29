export default defineEventHandler((event) => {
  const marker = String(getQuery(event).marker || 'missing')

  return {
    marker,
    requestId: crypto.randomUUID(),
  }
})
