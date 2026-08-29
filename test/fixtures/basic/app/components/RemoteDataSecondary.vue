<script setup lang="ts">
const remote = useRemoteData()
</script>

<template>
  <section id="remote-secondary">
    <output id="remote-secondary-marker">{{ remote.data.value?.marker }}</output>
    <output id="remote-secondary-request">{{ remote.data.value?.requestId }}</output>
    <output id="remote-secondary-status">{{ remote.status.value }}</output>
  </section>
</template>
