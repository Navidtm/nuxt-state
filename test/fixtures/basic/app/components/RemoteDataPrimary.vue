<script setup lang="ts">
const remote = useRemoteData()
</script>

<template>
  <section id="remote-primary">
    <output id="remote-primary-marker">{{ remote.data.value?.marker }}</output>
    <output id="remote-primary-request">{{ remote.data.value?.requestId }}</output>
    <output id="remote-primary-status">{{ remote.status.value }}</output>
    <output id="remote-primary-has-data">{{ remote.hasData.value }}</output>
    <button
      id="remote-refresh"
      type="button"
      @click="remote.refresh()"
    >
      Refresh
    </button>
  </section>
</template>
