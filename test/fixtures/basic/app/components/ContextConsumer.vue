<script setup lang="ts">
const state = useContextState()
state.componentSeen.value = state.instanceId.value
</script>

<template>
  <output id="component-shared">{{ state.componentSeen.value === state.instanceId.value }}</output>
</template>
