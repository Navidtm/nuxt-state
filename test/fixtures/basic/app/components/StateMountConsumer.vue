<script setup lang="ts">
const lazy = useLazyNavigationState()
</script>

<template>
  <section id="lazy-consumer">
    <output id="lazy-component-id">{{ lazy.creationId.value }}</output>
    <output id="lazy-component-count">{{ lazy.sharedCount.value }}</output>
  </section>
</template>
