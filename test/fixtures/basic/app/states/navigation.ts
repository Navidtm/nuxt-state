export const useNavigationState = defineState(() => {
  const route = useRoute()
  const router = useRouter()
  const count = ref(0)
  const path = computed(() => route.path)

  function addTen() {
    count.value += 10
  }

  function go(path: string) {
    return router.push(path)
  }

  return { count, path, addTen, go }
})

export const useLazyNavigationState = defineState(() => {
  const creationId = ref(crypto.randomUUID())
  const sharedCount = ref(0)

  function increment() {
    sharedCount.value++
  }

  return { creationId, sharedCount, increment }
})
