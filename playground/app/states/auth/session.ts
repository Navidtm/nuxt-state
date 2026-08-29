export const useSession = defineState(() => {
  const status = ref<'anonymous' | 'active'>('anonymous')

  function startSession() {
    status.value = 'active'
  }

  return {
    status,
    startSession,
  }
})
