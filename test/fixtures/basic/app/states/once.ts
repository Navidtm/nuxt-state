export const useOnceState = defineState(() => {
  const runs = ref(0)

  async function initialize() {
    await callOnce('nuxt-state-initialize', () => {
      runs.value++
    })
  }

  async function initializeForNavigation() {
    await callOnce(
      'nuxt-state-navigation-initialize',
      () => {
        runs.value++
      },
      { mode: 'navigation' },
    )
  }

  return { runs, initialize, initializeForNavigation }
})
