<script setup lang="ts">
const { graph } = useGraphState()

if (import.meta.server) {
  graph.a.value = 41
  graph.cycle.value = 'server'
  graph.createdAt = new Date('2026-01-02T03:04:05.000Z')
  graph.tags = new Set(['a', 'b'])
  graph.values = new Map([
    ['a', 1],
    ['b', 2],
  ])
  graph.items.splice(0, graph.items.length, 9)
  delete graph.obsolete
}
</script>

<template>
  <main>
    <output id="shared-value">{{ graph.b.value }}</output>
    <output id="shared-identity">{{ graph.a === graph.b }}</output>
    <output id="cycle-value">{{ graph.cycle.value }}</output>
    <output id="cycle-identity">{{ graph.cycle.self === graph.cycle }}</output>
    <output id="date-value">{{ graph.createdAt.toISOString() }}</output>
    <output id="set-value">{{ [...graph.tags].join(',') }}</output>
    <output id="map-value">{{ [...graph.values].flat().join(',') }}</output>
    <output id="array-value">{{ graph.items.join(',') }}</output>
    <output id="obsolete-value">{{ 'obsolete' in graph }}</output>
  </main>
</template>
