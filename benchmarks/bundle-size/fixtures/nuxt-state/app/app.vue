<script setup lang="ts">
const { count, double, increment } = useCounter()
</script>

<template>
  <main>
    <p>{{ count }} × 2 = {{ double }}</p>
    <button
      type="button"
      @click="increment"
    >
      Increment
    </button>
  </main>
</template>
