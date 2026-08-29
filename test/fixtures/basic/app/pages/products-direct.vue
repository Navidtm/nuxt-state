<script setup lang="ts">
const { data } = await useAsyncData('nuxt-state-products', () => $fetch('/api/products'))
</script>

<template>
  <output id="direct-product-count">{{ data?.products.length }}</output>
</template>
