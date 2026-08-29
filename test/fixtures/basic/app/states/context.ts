export const useContextState = defineState(() => {
  const token = useCookie<string | null>('nuxt-state-token', { default: () => null })
  const route = useRoute()
  const router = useRouter()
  const config = useRuntimeConfig()
  const instanceId = ref(crypto.randomUUID())
  const pluginSeen = ref('')
  const middlewareSeen = ref('')
  const layoutSeen = ref('')
  const pageSeen = ref('')
  const componentSeen = ref('')
  const authenticated = computed(() => Boolean(token.value))
  const path = computed(() => route.path)
  const runtimeLabel = computed(() => config.public.stateLabel)

  function logout() {
    token.value = null
  }

  function go(path: string) {
    return router.push(path)
  }

  return {
    token,
    instanceId,
    pluginSeen,
    middlewareSeen,
    layoutSeen,
    pageSeen,
    componentSeen,
    authenticated,
    path,
    runtimeLabel,
    logout,
    go,
  }
})
