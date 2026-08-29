<script setup lang="ts">
definePageMeta({ layout: 'context', middleware: 'context' })

const state = useContextState()
state.pageSeen.value = state.instanceId.value
</script>

<template>
  <main>
    <output id="plugin-shared">{{ state.pluginSeen.value === state.instanceId.value }}</output>
    <output id="middleware-shared">{{
      state.middlewareSeen.value === state.instanceId.value
    }}</output>
    <output id="page-shared">{{ state.pageSeen.value === state.instanceId.value }}</output>
    <output id="context-instance">{{ state.instanceId.value }}</output>
    <output id="context-path">{{ state.path.value }}</output>
    <output id="runtime-label">{{ state.runtimeLabel.value }}</output>
    <output id="cookie-token">{{ state.token.value }}</output>
    <output id="cookie-authenticated">{{ state.authenticated.value }}</output>
    <ContextConsumer />
    <button
      id="cookie-logout"
      type="button"
      @click="state.logout"
    >
      Logout
    </button>
    <button
      id="context-next"
      type="button"
      @click="state.go('/context-b')"
    >
      Next
    </button>
  </main>
</template>
