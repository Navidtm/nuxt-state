<script setup lang="ts">
const { data } = await useFetch('/api/large-payload', {
  key: 'nuxt-state-large-payload',
})
</script>

<template>
  <output id="large-size">{{ data?.content.length }}</output>
</template>
