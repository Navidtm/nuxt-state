export const useDevtoolsActiveState = defineState(() => {
  const count = ref(0)
  const shallow = shallowRef({ nested: 'initial' })
  const profile = reactive({ name: 'Nuxt', roles: ['developer'] })
  const cycle: { label: string; self?: unknown } = { label: 'cycle' }
  cycle.self = cycle
  const large = ref(`NUXT_STATE_INSPECTOR_${'x'.repeat(2_000)}`)
  const double = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, shallow, profile, cycle, large, double, increment }
})

export const useDevtoolsLazyState = defineState(() => {
  const factoryCalls = useState('nuxt-state-devtools-lazy-calls', () => 0)
  factoryCalls.value++
  return { value: ref('lazy'), factoryCalls }
})
