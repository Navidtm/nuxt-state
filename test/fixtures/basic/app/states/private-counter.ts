export const usePrivateCounter = defineState(() => {
  const count = ref(0)
  const double = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { double, increment }
})
