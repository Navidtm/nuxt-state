<script setup lang="ts">
const requestURL = useRequestURL()
const marker = requestURL.searchParams.get('marker') || 'missing'
const delay = Number(requestURL.searchParams.get('delay') || 0)
const state = useRequestProbe()
const before = state.marker.value

state.marker.value = marker
await new Promise((resolve) => setTimeout(resolve, delay))
const after = state.marker.value
</script>

<template>
  <div
    id="request-probe"
    :data-before="before"
    :data-after="after"
  >
    {{ marker }}
  </div>
</template>
