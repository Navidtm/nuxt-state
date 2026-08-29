export const useUser = defineState(() => {
  const user = reactive({
    name: 'Guest',
    authenticated: false,
  })

  const label = computed(() => user.authenticated ? user.name : 'Guest')

  function login() {
    user.name = 'Nuxt User'
    user.authenticated = true
  }

  return {
    user,
    label,
    login,
  }
})
