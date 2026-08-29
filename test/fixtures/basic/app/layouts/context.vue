<script setup lang="ts">
const state = useContextState()
state.layoutSeen.value = state.instanceId.value
</script>

<template>
  <section id="context-layout">
    <output id="layout-shared">{{ state.layoutSeen.value === state.instanceId.value }}</output>
    <slot />
  </section>
</template>
