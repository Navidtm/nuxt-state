export const useProducts = defineState(() => {
  const shouldFail = ref(false)
  const request = useAsyncData('nuxt-state-products', () =>
    $fetch('/api/products', { query: { fail: shouldFail.value ? '1' : undefined } }),
  )
  const { data, status, error, refresh } = request
  const count = computed(() => data.value?.products.length ?? 0)

  async function failRefresh() {
    shouldFail.value = true
    await refresh()
  }

  async function recover() {
    shouldFail.value = false
    await refresh()
  }

  return { data, status, error, count, refresh, failRefresh, recover, ready: request }
})
