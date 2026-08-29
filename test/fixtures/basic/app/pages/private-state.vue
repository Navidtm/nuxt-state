<script setup lang="ts">
const { double, increment } = usePrivateCounter()

if (import.meta.server) increment()
</script>

<template>
  <output id="private-double">{{ double }}</output>
</template>
