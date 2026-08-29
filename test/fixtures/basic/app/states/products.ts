export const useProducts = defineState(() => {
  const request = useAsyncData('nuxt-state-products', () => $fetch('/api/products'))
  const { data, status, error, refresh } = request
  const count = computed(() => data.value?.products.length ?? 0)

  return { data, status, error, count, refresh, ready: request }
})
