export const useFixtureSession = defineState(() => {
  const source = ref('nested-state')
  return { source }
})
