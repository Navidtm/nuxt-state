<script setup lang="ts">
const shallow = useShallowState()

if (import.meta.server) {
  shallow.catalog.value = {
    version: 2,
    items: [{ id: 2, name: 'Server' }],
  }
  shallow.session.user = 'Server User'
  shallow.session.metadata = { version: 2 }
}
</script>

<template>
  <main>
    <output id="catalog-version">{{ shallow.catalog.value.version }}</output>
    <output id="catalog-name">{{ shallow.catalog.value.items[0]?.name }}</output>
    <output id="session-user">{{ shallow.session.user }}</output>
    <output id="metadata-version">{{ shallow.session.metadata.version }}</output>
    <output id="catalog-deep">{{ shallow.catalogIsDeep.value }}</output>
    <output id="session-deep">{{ shallow.sessionIsDeep.value }}</output>
    <button
      id="mutate-shallow"
      type="button"
      @click="shallow.mutateNested"
    >
      Mutate nested
    </button>
    <button
      id="replace-shallow"
      type="button"
      @click="shallow.replaceValues"
    >
      Replace
    </button>
  </main>
</template>
