<script setup lang="ts">
const once = useOnceState()
await once.initialize()
await once.initialize()
</script>

<template>
  <output id="once-runs">{{ once.runs }}</output>
</template>
