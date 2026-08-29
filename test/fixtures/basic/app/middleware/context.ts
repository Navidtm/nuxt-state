export default defineNuxtRouteMiddleware(() => {
  const state = useContextState()
  state.middlewareSeen.value = state.instanceId.value

  if (!state.token.value) state.token.value = 'server-token'
})
