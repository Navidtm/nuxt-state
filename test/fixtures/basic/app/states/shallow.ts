export const useShallowState = defineState(() => {
  const catalog = shallowRef({
    version: 1,
    items: [{ id: 1, name: 'Initial' }],
  })
  const session = shallowReactive({
    user: null as null | string,
    metadata: { version: 1 },
  })
  const catalogIsDeep = computed(() => isReactive(catalog.value.items))
  const sessionIsDeep = computed(() => isReactive(session.metadata))

  function mutateNested() {
    catalog.value.version = 3
    session.metadata.version = 3
  }

  function replaceValues() {
    catalog.value = { version: 4, items: [{ id: 4, name: 'Client' }] }
    session.metadata = { version: 4 }
  }

  return {
    catalog,
    session,
    catalogIsDeep,
    sessionIsDeep,
    mutateNested,
    replaceValues,
  }
})
