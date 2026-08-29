<script setup lang="ts">
definePageMeta({ layout: 'context', middleware: 'context' })

const state = useContextState()
state.pageSeen.value = state.instanceId.value
</script>

<template>
  <main>
    <output id="context-path">{{ state.path.value }}</output>
    <output id="context-instance">{{ state.instanceId.value }}</output>
    <output id="middleware-shared">{{
      state.middlewareSeen.value === state.instanceId.value
    }}</output>
    <button
      id="context-back"
      type="button"
      @click="state.go('/context-a')"
    >
      Back
    </button>
  </main>
</template>
