export const useHydrationCounter = defineState(() => {
  const count = ref(0)
  const double = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, double, increment }
})

export const useHydrationUser = defineState(() => {
  const user = reactive({
    name: 'Client Initial',
    authenticated: false,
  })
  const label = computed(() => (user.authenticated ? user.name : 'Guest'))

  function login(name: string) {
    user.name = name
    user.authenticated = true
  }

  return { user, label, login }
})
