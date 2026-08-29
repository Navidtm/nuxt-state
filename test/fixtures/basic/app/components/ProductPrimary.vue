<script setup lang="ts">
const products = useProducts()
</script>

<template>
  <section id="product-primary">
    <output id="product-primary-count">{{ products.count.value }}</output>
    <output id="product-primary-request">{{ products.data.value?.requestId }}</output>
    <output id="product-primary-status">{{ products.status.value }}</output>
    <output id="product-primary-error">{{ Boolean(products.error.value) }}</output>
    <button
      id="product-refresh"
      type="button"
      @click="products.refresh()"
    >
      Refresh
    </button>
  </section>
</template>
