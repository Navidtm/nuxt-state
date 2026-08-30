export const useRouteState = defineState(() => {
  const route = useRoute()
  const path = computed(() => route.path)

  return { path }
})
