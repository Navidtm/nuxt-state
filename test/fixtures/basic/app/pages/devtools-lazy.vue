<script setup lang="ts">
const lazy = useDevtoolsLazyState()
</script>

<template>
  <main>
    <output id="devtools-lazy-value">{{ lazy.value }}</output>
    <output id="devtools-lazy-factory-calls">{{ lazy.factoryCalls }}</output>
    <NuxtLink
      id="devtools-back"
      to="/devtools"
      >Back</NuxtLink
    >
  </main>
</template>
