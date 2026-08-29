<script setup lang="ts">
const { count, double, increment } = useCounter()
</script>

<template>
  <section class="card card--accent">
    <span class="eyebrow">Component B</span>
    <h2>Independent caller</h2>
    <p class="metric">
      {{ count }}
    </p>
    <p>Double: {{ double }}</p>
    <button
      type="button"
      @click="increment"
    >
      Increment from here
    </button>
  </section>
</template>
