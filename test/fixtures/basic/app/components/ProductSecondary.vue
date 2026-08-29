<script setup lang="ts">
const products = useProducts()
</script>

<template>
  <section id="product-secondary">
    <output id="product-secondary-count">{{ products.count.value }}</output>
    <output id="product-secondary-request">{{ products.data.value?.requestId }}</output>
  </section>
</template>
