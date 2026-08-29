<script setup lang="ts">
// Resolve the shared request before sibling SSR renders so both consumers
// observe the same completed AsyncData instance.
await useRemoteData().ready
</script>

<template>
  <main>
    <RemoteDataPrimary />
    <RemoteDataSecondary />
    <NuxtLink
      id="remote-navigation"
      to="/navigation-b"
      >Continue</NuxtLink
    >
  </main>
</template>
