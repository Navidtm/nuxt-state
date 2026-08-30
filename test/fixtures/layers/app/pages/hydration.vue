<script setup lang="ts">
const { count, double, increment } = useLayerCounter()

if (import.meta.server) {
  increment()
}
</script>

<template>
  <main>
    <output id="layer-count">{{ count }}</output>
    <output id="layer-double">{{ double }}</output>
    <button
      id="layer-increment"
      @click="increment"
    >
      Increment
    </button>
  </main>
</template>
