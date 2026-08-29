export const useRemoteData = defineState(() => {
  const marker = useRequestURL().searchParams.get('marker') || 'missing'
  const request = useFetch('/api/example', {
    key: 'nuxt-state-remote-data',
    query: { marker },
  })
  const { data, status, refresh } = request
  const hasData = computed(() => Boolean(data.value))

  return { data, status, hasData, refresh, ready: request }
})
