export const useLargePayload = defineState(() => {
  const request = useFetch('/api/large-payload', {
    key: 'nuxt-state-large-payload',
  })

  return { data: request.data, ready: request }
})
