export default defineNuxtPlugin(() => {
  if (!useRoute().path.startsWith('/context')) return

  const state = useContextState()
  state.pluginSeen.value = state.instanceId.value
})
