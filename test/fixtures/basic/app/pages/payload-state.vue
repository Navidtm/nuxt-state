<script setup lang="ts">
const remote = useLargePayload()
await remote.ready
</script>

<template>
  <output id="large-size">{{ remote.data.value?.content.length }}</output>
</template>
