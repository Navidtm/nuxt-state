export const useCatalog = defineState(() => {
  const featured = shallowRef({ id: 1, title: 'Nuxt State' })
  const filters = shallowReactive({ query: '', nested: { untouched: true } })
  const metadata = reactive({
    updatedAt: new Date('2026-08-30T00:00:00.000Z'),
    tags: new Set(['nuxt', 'vue']),
    scores: new Map([['prototype', 1]]),
  })

  return { featured, filters, metadata }
})
