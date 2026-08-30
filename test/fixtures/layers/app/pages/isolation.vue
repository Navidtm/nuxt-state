<script setup lang="ts">
const query = useRequestURL().searchParams
const marker = query.get('marker') || 'missing'
const delay = Number(query.get('delay') || 0)
const state = useLayerRequestProbe()
const before = state.marker.value

state.marker.value = marker
await new Promise((resolve) => setTimeout(resolve, delay))
</script>

<template>
  <main
    :data-before="before"
    :data-after="state.marker.value"
  >
    {{ state.marker.value }}
  </main>
</template>
