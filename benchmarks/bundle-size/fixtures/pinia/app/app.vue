<script setup lang="ts">
const counter = useCounterStore()
const { count, double } = storeToRefs(counter)
</script>

<template>
  <main>
    <p>{{ count }} × 2 = {{ double }}</p>
    <button
      type="button"
      @click="counter.increment"
    >
      Increment
    </button>
  </main>
</template>
