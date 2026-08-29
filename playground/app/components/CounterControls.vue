<script setup lang="ts">
const { count, double, increment } = useCounter()
</script>

<template>
  <section class="card">
    <span class="eyebrow">Component A</span>
    <h2>Controls</h2>
    <p class="metric">
      {{ count }}
    </p>
    <p>Double: {{ double }}</p>
    <button
      type="button"
      @click="increment"
    >
      Increment shared count
    </button>
  </section>
</template>
