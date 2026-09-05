<script setup lang="ts">
const count = useState('bundle-size-counter', () => 0)
const double = computed(() => count.value * 2)
const increment = () => count.value++
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
